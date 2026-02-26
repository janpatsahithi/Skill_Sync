from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import List, Optional
from bson import ObjectId

from app.core.deps import get_current_user
from app.db.database import feedback_collection
from app.schemas import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Feedback & Reflection"])


@router.post("", response_model=FeedbackResponse)
def create_feedback(
    feedback: FeedbackCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit feedback on AI recommendations.
    This enables human-in-the-loop learning and system improvement.
    """
    user_id = current_user.get("user_id")
    email = current_user.get("email")

    feedback_data = {
        "user_id": user_id,
        "email": email,
        "recommendation_id": feedback.recommendation_id,
        "recommendation_type": feedback.recommendation_type,
        "rating": feedback.rating,
        "feedback_text": feedback.feedback_text,
        "was_helpful": feedback.was_helpful,
        "reflection_notes": feedback.reflection_notes,
        "created_at": datetime.utcnow()
    }

    result = feedback_collection.insert_one(feedback_data)
    feedback_data["id"] = str(result.inserted_id)

    return FeedbackResponse(**feedback_data)


@router.get("", response_model=List[FeedbackResponse])
def get_feedback(
    recommendation_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's feedback history."""
    email = current_user.get("email")
    query = {"email": email}

    if recommendation_type:
        query["recommendation_type"] = recommendation_type

    feedback_list = list(
        feedback_collection.find(query)
        .sort("created_at", -1)
    )

    return [FeedbackResponse(**{**fb, "id": str(fb["_id"])}) for fb in feedback_list]


@router.get("/stats")
def get_feedback_stats(current_user: dict = Depends(get_current_user)):
    """Get aggregated feedback statistics for the user."""
    email = current_user.get("email")
    feedback_list = list(feedback_collection.find({"email": email}))

    if not feedback_list:
        return {
            "total_feedback": 0,
            "average_rating": 0,
            "helpful_count": 0,
            "not_helpful_count": 0
        }

    total = len(feedback_list)
    ratings = [fb.get("rating", 0) for fb in feedback_list]
    helpful_count = sum(1 for fb in feedback_list if fb.get("was_helpful", False))

    return {
        "total_feedback": total,
        "average_rating": sum(ratings) / total if ratings else 0,
        "helpful_count": helpful_count,
        "not_helpful_count": total - helpful_count,
        "by_type": {}
    }



