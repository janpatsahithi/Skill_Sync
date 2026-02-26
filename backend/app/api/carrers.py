from fastapi import APIRouter, Depends
from app.models.job_recommender import JobRecommender
from app.db.database import get_db
from app.core.deps import get_current_user

router = APIRouter(prefix="/careers", tags=["Careers"])


def get_recommender():
    """
    Lazy initialization to prevent server startup crash
    """
    return JobRecommender()


@router.get("/recommend")
def recommend_careers(
    user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    record = db.user_skills.find_one({"user_id": user["_id"]})

    if not record or not record.get("skills"):
        return {"recommendations": []}

    skill_uris = {s["uri"] for s in record["skills"]}

    recommender = get_recommender()
    recommendations = recommender.recommend(skill_uris)

    return {
        "user_id": str(user["_id"]),
        "recommendations": recommendations
    }
