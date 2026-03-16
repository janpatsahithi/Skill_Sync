from fastapi import APIRouter, Body, Depends, Query
from typing import Any
from app.models.job_recommender import JobRecommender
from app.services.market_job_service import MarketJobService
from app.schemas import JobRecommendationResponse, JobRecommendationListResponse
from app.utils.job_links import generate_job_links
from app.core.deps import get_current_user
from app.services.job_recommendation_presenter import (
    role_meta,
    skill_name,
    display_match_score,
)
from app.services.target_role_job_recommendation_service import TargetRoleJobRecommendationService

router = APIRouter(prefix="/jobs", tags=["Jobs"])

recommender = JobRecommender()
market_job_service = MarketJobService()
target_role_service = TargetRoleJobRecommendationService()


@router.post("/recommend", response_model=JobRecommendationListResponse)
def recommend(payload: Any = Body(...)):
    """
    Accept either a raw list body (e.g. ["s1","s2"]) or
    an object { skills: [...] }.
    """
    if isinstance(payload, dict):
        skills = payload.get("skills") or payload.get("user_skills")
    else:
        skills = payload

    raw_results = recommender.recommend(skills)
    recommendations = []

    for item in raw_results:
        role_info = role_meta(item["occupation_uri"])
        matched_skills = [skill_name(s) for s in item.get("matched_skills", [])]
        missing_skills = [skill_name(s) for s in item.get("missing_skills", [])]
        score = display_match_score(matched_skills, missing_skills)

        recommendations.append(
            {
                "role": role_info["role"],
                "match_score": score,
                "description": role_info["description"],
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "job_links": generate_job_links(role_info["role"]),
            }
        )

    HIGH_MATCH_THRESHOLD = 60
    high_match_roles = [
        role for role in recommendations
        if role["match_score"] >= HIGH_MATCH_THRESHOLD
    ]

    if len(high_match_roles) >= 3:
        return {"jobs": high_match_roles[:6], "message": None}

    return {
        "jobs": recommendations[:3],
        "message": "No highly aligned roles found. Consider improving missing skills.",
    }


@router.get("/recommendations")
def get_role_constrained_recommendations(
    role: str | None = Query(None, min_length=2),
    current_user: dict = Depends(get_current_user),
):
    """
    Role-constrained recommendations aligned to predefined Skill Gap roles.
    Uses stored user skills and returns top jobs within allowed role categories only.
    """
    email = current_user.get("email")
    result = target_role_service.recommend(email=email, selected_role=role)

    # Attach external links while preserving the constrained response format.
    enriched = []
    for item in result.get("recommended_jobs", []):
        row = {
            **item,
            "job_links": generate_job_links(item.get("title") or item.get("role_category") or "Job"),
        }
        enriched.append(row)

    result["recommended_jobs"] = enriched
    result["jobs"] = enriched  # Backward compatibility
    return result


@router.get("/market-trends")
def market_trends(
    role: str = Query(..., min_length=2, description="Target role, e.g. Data Analyst"),
    location: str = Query("United States"),
    top_k: int = Query(10, ge=1, le=30),
    refresh: bool = Query(False, description="Force refresh instead of cache"),
):
    """
    Fetch live job postings and return top in-demand skills for a role/location.
    Falls back gracefully when API credentials are missing.
    """
    return market_job_service.get_market_trends(
        role=role,
        location=location,
        top_k=top_k,
        force_refresh=refresh,
    )


@router.get("/trending-roles")
def trending_roles(
    location: str = Query("United States"),
):
    """
    Return role-level market activity based on live postings.
    """
    return market_job_service.get_trending_roles(location=location)
