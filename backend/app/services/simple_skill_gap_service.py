from app.core.canonical_skill_store import CANONICAL_OCCUPATION_SKILLS
from app.models.skill_normalizer import normalize_skills
from app.services.market_job_service import MarketJobService

market_job_service = MarketJobService()


def compute_skill_gap(user_skills: list[str], occupation: str):
    user = set(normalize_skills(user_skills))
    job = CANONICAL_OCCUPATION_SKILLS.get(occupation)
    if not job:
        return {"error": "Unknown occupation"}

    essential = set(job["essential"])
    optional = set(job["optional"])

    covered = user & (essential | optional)
    missing_essential = essential - user
    missing_optional = optional - user

    total_score = len(essential) * 2 + len(optional)
    gap_score = len(missing_essential) * 2 + len(missing_optional)
    readiness = round(1 - gap_score / total_score, 2)

    market_trends = market_job_service.get_market_trends(role=occupation, top_k=15)
    top_market_skills = market_trends.get("top_skills", [])
    demand_map = {s["skill"].lower(): s for s in top_market_skills if s.get("skill")}

    enriched_missing = []
    for skill in sorted(missing_essential):
        demand = demand_map.get(skill.lower(), {})
        demand_pct = float(demand.get("demand_pct", 0.0))
        enriched_missing.append(
            {
                "skill": skill,
                "importance": "essential",
                "market_demand_pct": demand_pct,
                "market_frequency": int(demand.get("frequency", 0)),
                "priority_score": round((2.0 + demand_pct / 100.0) * 100, 1),
            }
        )

    for skill in sorted(missing_optional):
        demand = demand_map.get(skill.lower(), {})
        demand_pct = float(demand.get("demand_pct", 0.0))
        enriched_missing.append(
            {
                "skill": skill,
                "importance": "optional",
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
        "occupation": occupation,
        "readiness_score": readiness,
        "market_readiness_score": market_readiness,
        "covered_skills": sorted(list(covered)),
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
