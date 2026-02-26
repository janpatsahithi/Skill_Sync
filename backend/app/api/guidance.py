from fastapi import APIRouter, Depends, HTTPException



from datetime import datetime
from typing import List

from app.core.deps import get_current_user
from app.db.database import user_skills_collection, user_context_collection
from app.schemas import GuidanceRequest, GuidanceResponse, RecommendationItem
from app.models.job_recommender import JobRecommender
from app.services.simple_skill_gap_service import compute_skill_gap
from app.services.rag_reasoner import generate_learning_path

router = APIRouter(prefix="/guidance", tags=["Intelligent Guidance"])

# Initialize AI engine services (black-box integration)
job_recommender = JobRecommender()


@router.post("", response_model=GuidanceResponse)
def get_guidance(
    request: GuidanceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get intelligent guidance and recommendations based on user goals.
    This endpoint integrates with the existing AI skill engine (black-box service).
    """
    email = current_user.get("email")
    user_id = current_user.get("user_id")

    # Get user skills from existing system
    user_skills_data = user_skills_collection.find_one({"email": email})
    user_skills = [s["skill"] for s in user_skills_data.get("skills", [])] if user_skills_data else []

    # Get user context
    user_context = user_context_collection.find_one({"email": email})

    recommendations: List[RecommendationItem] = []
    skill_gap_analysis = None
    learning_path_data = None

    # Integrate with existing AI engine based on goal type
    if request.goal_type == "career_change" and request.target_occupation_uri:
        # Use existing skill gap analysis (black-box service)
        try:
            gap_result = compute_skill_gap(
                user_skills=user_skills,
                occupation=request.target_occupation_uri
            )
            skill_gap_analysis = gap_result

            # Generate job recommendations using existing service
            job_recs = job_recommender.recommend(user_skills)
            for job in job_recs.get("recommendations", [])[:5]:
                recommendations.append(RecommendationItem(
                    type="job",
                    title=job.get("label", "Job Opportunity"),
                    description=f"Match score: {job.get('match_score', 0):.2%}",
                    relevance_score=job.get("match_score", 0),
                    reasoning=f"Based on your skills: {', '.join(user_skills[:3])}",
                    action_items=[
                        "Review job requirements",
                        "Update resume with relevant skills",
                        "Apply for position"
                    ]
                ))

            # Generate learning path using existing service
            missing_essential = gap_result.get("missing_essential")
            if not missing_essential and isinstance(gap_result.get("missing_skills"), list):
                missing_essential = [
                    s.get("skill")
                    for s in gap_result["missing_skills"]
                    if isinstance(s, dict) and s.get("skill") and s.get("importance") == "essential"
                ]

            if not missing_essential and isinstance(gap_result.get("missing_skills"), list):
                missing_essential = [
                    s.get("skill")
                    for s in gap_result["missing_skills"]
                    if isinstance(s, dict) and s.get("skill")
                ]

            if missing_essential:
                learning_path_data = generate_learning_path(
                    occupation=request.target_occupation_uri,
                    missing_skills=missing_essential
                )
                if learning_path_data:
                    recommendations.append(RecommendationItem(
                        type="learning_resource",
                        title="Personalized Learning Path",
                        description=learning_path_data.get("summary", "Custom learning path"),
                        relevance_score=0.9,
                        reasoning="Based on skill gap analysis",
                        action_items=learning_path_data.get("steps", [])
                    ))

        except Exception as e:
            print(f"Error calling AI engine: {e}")

    elif request.goal_type == "skill_development":
        # Get job recommendations for skill development
        try:
            job_recs = job_recommender.recommend(user_skills)
            for job in job_recs.get("recommendations", [])[:3]:
                recommendations.append(RecommendationItem(
                    type="job",
                    title=job.get("label", "Job Opportunity"),
                    description=f"Requires skills you're developing",
                    relevance_score=job.get("match_score", 0),
                    reasoning="Target roles for skill development",
                    action_items=["Focus on missing skills", "Take relevant courses"]
                ))
        except Exception as e:
            print(f"Error calling AI engine: {e}")

    elif request.goal_type == "job_search":
        # Get job recommendations
        try:
            job_recs = job_recommender.recommend(user_skills)
            for job in job_recs.get("recommendations", [])[:5]:
                recommendations.append(RecommendationItem(
                    type="job",
                    title=job.get("label", "Job Opportunity"),
                    description=f"Match: {job.get('match_score', 0):.2%}",
                    relevance_score=job.get("match_score", 0),
                    reasoning="Based on your current skill profile",
                    action_items=["Review job details", "Tailor application"]
                ))
        except Exception as e:
            print(f"Error calling AI engine: {e}")

    return GuidanceResponse(
        user_id=user_id,
        recommendations=recommendations,
        skill_gap_analysis=skill_gap_analysis,
        learning_path=learning_path_data,
        generated_at=datetime.utcnow()
    )


@router.get("/explain/{recommendation_id}")
def explain_recommendation(
    recommendation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get explainable reasoning for a specific recommendation.
    """
    # This would fetch stored recommendation and provide detailed explanation
    return {
        "recommendation_id": recommendation_id,
        "explanation": "Detailed reasoning based on user profile, skills, and goals",
        "factors": [
            "Skill match score",
            "User career goals",
            "Market demand",
            "Learning path alignment"
        ]
    }
