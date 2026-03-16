import json
from pathlib import Path
import re

from app.core.canonical_skill_store import CANONICAL_OCCUPATION_SKILLS
from app.services.market_job_service import MarketJobService

BASE_DIR = Path(__file__).resolve().parents[1]
FALLBACK_FILE = BASE_DIR / "datasets" / "fallback_roles.json"

market_job_service = MarketJobService()


def _slugify_role(label: str) -> str:
    return label.lower().strip().replace(" ", "-")


def _load_fallback_role_skills() -> tuple[dict[str, list[str]], dict[str, str]]:
    try:
        with open(FALLBACK_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return {}, {}

    role_skill_map: dict[str, list[str]] = {}
    role_name_map: dict[str, str] = {}
    for role in data.get("roles", []):
        role_name = (role.get("role") or "").strip()
        if not role_name:
            continue
        uri = f"fallback://role/{_slugify_role(role_name)}"
        role_name_map[uri] = role_name
        skills = []
        for s in role.get("skills", []):
            name = (s.get("name") or "").strip().lower()
            if name:
                skills.append(name)
        role_skill_map[uri] = skills
    return role_skill_map, role_name_map


FALLBACK_ROLE_SKILLS, FALLBACK_ROLE_NAMES = _load_fallback_role_skills()


def _normalize_key(value: str) -> str:
    text = (value or "").strip().lower()
    text = text.replace(".js", "")
    text = text.replace("nodejs", "node")
    text = text.replace("reactjs", "react")
    text = text.replace("rest apis", "rest api")
    text = text.replace("tailwind css", "tailwind")
    text = "".join(ch if (ch.isalnum() or ch in {" ", "+", "#"}) else " " for ch in text)
    return " ".join(text.split())


def _extract_user_skill_keys(user_skills: list) -> set[str]:
    keys: set[str] = set()
    for item in user_skills:
        if isinstance(item, dict):
            key = _normalize_key(str(item.get("normalized_key") or item.get("label") or item.get("skill") or ""))
        else:
            key = _normalize_key(str(item))
        if key:
            keys.add(key)
    return keys


def _extract_required_skill_weights(required_skills: list) -> dict[str, float]:
    """
    Supports:
    - ["python", "sql"]
    - [{"name": "python", "weight": 2}, {"skill": "sql"}]
    """
    weights: dict[str, float] = {}
    for item in required_skills:
        if isinstance(item, dict):
            key = _normalize_key(str(item.get("normalized_key") or item.get("name") or item.get("skill") or ""))
            raw_weight = item.get("weight", 1.0)
            try:
                weight = float(raw_weight)
            except (TypeError, ValueError):
                weight = 1.0
        else:
            key = _normalize_key(str(item))
            weight = 1.0

        if not key:
            continue
        if weight <= 0:
            weight = 1.0
        weights[key] = max(weights.get(key, 0.0), weight)
    return weights


def _humanize_role_name(occupation_uri: str) -> str:
    if occupation_uri in FALLBACK_ROLE_NAMES:
        return FALLBACK_ROLE_NAMES[occupation_uri]
    slug = occupation_uri.rsplit("/", 1)[-1]
    slug = re.sub(r"[-_]+", " ", slug)
    return slug.strip().title() if slug else occupation_uri


def compute_skill_gap(user_skills: list, occupation_uri: str):
    """
    Compute skill gap and enrich missing-skill prioritization with live market demand.
    """
    job = CANONICAL_OCCUPATION_SKILLS.get(occupation_uri)

    data_source = "esco"
    role_name = _humanize_role_name(occupation_uri)
    if job:
        required_weights = _extract_required_skill_weights(job.get("essential", []))
    else:
        data_source = "fallback"
        required_weights = _extract_required_skill_weights(FALLBACK_ROLE_SKILLS.get(occupation_uri, []))
        role_name = FALLBACK_ROLE_NAMES.get(occupation_uri, role_name)
        if not required_weights:
            return {"error": "Unknown occupation"}

    user = _extract_user_skill_keys(user_skills)

    required_keys = set(required_weights.keys())
    covered = sorted(required_keys & user)
    missing = sorted(required_keys - user)

    if not required_keys:
        return {
            "role_name": role_name,
            "readiness_score": 0.0,
            "matched_count": 0,
            "total_required": 0,
            "covered_skills": [],
            "missing_skills": [],
        }

    total_weight = sum(required_weights.values())
    covered_weight = sum(required_weights.get(k, 0.0) for k in covered)
    if total_weight > 0:
        readiness_pct = round(min((covered_weight / total_weight) * 100.0, 100.0), 2)
    else:
        readiness_pct = round(min((len(covered) / len(required_keys)) * 100.0, 100.0), 2)

    market_trends = market_job_service.get_market_trends(role=occupation_uri, top_k=15)
    top_market_skills = market_trends.get("top_skills", [])
    demand_map = {_normalize_key(str(s.get("skill", ""))): s for s in top_market_skills if s.get("skill")}

    enriched_missing = []
    for skill in missing:
        demand = demand_map.get(_normalize_key(skill), {})
        demand_pct = int(round(float(demand.get("demand_pct", 0.0))))
        enriched_missing.append(
            {
                "name": skill,
                "market_demand": demand_pct,
                "priority_rank": 0,
            }
        )

    enriched_missing.sort(key=lambda x: x["market_demand"], reverse=True)
    for idx, item in enumerate(enriched_missing, start=1):
        item["priority_rank"] = idx

    market_readiness = None
    if top_market_skills:
        market_skill_set = {_normalize_key(str(s.get("skill", ""))) for s in top_market_skills if s.get("skill")}
        market_covered = len(market_skill_set & user)
        market_readiness = round(market_covered / len(market_skill_set), 2) if market_skill_set else None

    return {
        "data_source": data_source,
        "role_name": role_name,
        "readiness_score": readiness_pct,
        "matched_count": len(covered),
        "total_required": len(required_keys),
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
