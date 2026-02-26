import json
from pathlib import Path

from app.core.canonical_skill_store import CANONICAL_OCCUPATION_SKILLS
from app.services.market_job_service import MarketJobService

BASE_DIR = Path(__file__).resolve().parents[1]
FALLBACK_FILE = BASE_DIR / "datasets" / "fallback_roles.json"

market_job_service = MarketJobService()


def _slugify_role(label: str) -> str:
    return label.lower().strip().replace(" ", "-")


def _load_fallback_role_skills() -> dict[str, list[str]]:
    try:
        with open(FALLBACK_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return {}

    role_skill_map: dict[str, list[str]] = {}
    for role in data.get("roles", []):
        role_name = (role.get("role") or "").strip()
        if not role_name:
            continue
        uri = f"fallback://role/{_slugify_role(role_name)}"
        skills = []
        for s in role.get("skills", []):
            name = (s.get("name") or "").strip().lower()
            if name:
                skills.append(name)
        role_skill_map[uri] = skills
    return role_skill_map


FALLBACK_ROLE_SKILLS = _load_fallback_role_skills()


def compute_skill_gap(user_skills: list[str], occupation_uri: str):
    """
    Compute skill gap and enrich missing-skill prioritization with live market demand.
    """
    job = CANONICAL_OCCUPATION_SKILLS.get(occupation_uri)

    data_source = "esco"
    if job:
        essential = set(s.lower() for s in job.get("essential", []))
    else:
        data_source = "fallback"
        essential = set(FALLBACK_ROLE_SKILLS.get(occupation_uri, []))
        if not essential:
            return {"error": "Unknown occupation"}

    user = set(s.lower() for s in user_skills)

    covered = sorted(essential & user)
    missing = sorted(essential - user)
    readiness = round(len(covered) / len(essential), 2) if essential else 1.0

    market_trends = market_job_service.get_market_trends(role=occupation_uri, top_k=15)
    top_market_skills = market_trends.get("top_skills", [])
    demand_map = {s["skill"].lower(): s for s in top_market_skills if s.get("skill")}

    enriched_missing = []
    for skill in missing:
        demand = demand_map.get(skill.lower(), {})
        demand_pct = float(demand.get("demand_pct", 0.0))
        enriched_missing.append(
            {
                "skill": skill,
                "market_demand_pct": demand_pct,
                "market_frequency": int(demand.get("frequency", 0)),
                "priority_score": round((1.0 + demand_pct / 100.0) * 100, 1),
            }
        )

    enriched_missing.sort(key=lambda x: x["priority_score"], reverse=True)

    market_readiness = None
    if top_market_skills:
        market_skill_set = {s["skill"].lower() for s in top_market_skills}
        market_covered = len(market_skill_set & user)
        market_readiness = round(market_covered / len(market_skill_set), 2) if market_skill_set else None

    return {
        "data_source": data_source,
        "readiness_score": readiness,
        "market_readiness_score": market_readiness,
        "covered_skills": covered,
        "missing_skills": enriched_missing,
        "top_market_skills": top_market_skills,
        "market_context": {
            "role": market_trends.get("role"),
            "location": market_trends.get("location"),
            "total_jobs_analyzed": market_trends.get("total_jobs_analyzed", 0),
            "data_source": market_trends.get("data_source"),
            "last_updated": market_trends.get("last_updated"),
        },
    }
