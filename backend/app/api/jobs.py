from fastapi import APIRouter, Body, Query
from typing import Any
from app.models.job_recommender import JobRecommender
from app.services.market_job_service import MarketJobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])

recommender = JobRecommender()
market_job_service = MarketJobService()


@router.post("/recommend")
def recommend(payload: Any = Body(...)):
    """
    Accept either a raw list body (e.g. ["s1","s2"]) or
    an object { skills: [...] }.
    """
    if isinstance(payload, dict):
        skills = payload.get("skills") or payload.get("user_skills")
    else:
        skills = payload

    return recommender.recommend(skills)


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
