from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import Optional
from bson import ObjectId

from app.core.deps import get_current_user
from app.db.database import user_context_collection
from app.schemas import (
    UserContextCreate,
    UserContextUpdate,
    UserContextResponse
)

router = APIRouter(prefix="/user-context", tags=["User Context"])

def _normalize_context_document(context: dict, fallback_email: str, fallback_user_id: str) -> dict:
    """Ensure required response fields always exist with safe defaults."""
    now = datetime.utcnow()
    normalized = dict(context or {})
    normalized["user_id"] = str(normalized.get("user_id") or fallback_user_id or "")
    normalized["email"] = normalized.get("email") or fallback_email or ""
    normalized["background"] = normalized.get("background")
    normalized["interests"] = normalized.get("interests") or []
    normalized["career_goals"] = normalized.get("career_goals")
    normalized["preferences"] = normalized.get("preferences") or {}
    normalized["availability_hours_per_week"] = normalized.get("availability_hours_per_week")
    normalized["onboarding_completed"] = bool(normalized.get("onboarding_completed", False))
    normalized["onboarding_data"] = normalized.get("onboarding_data")
    normalized["last_skill_gap"] = normalized.get("last_skill_gap")
    normalized["created_at"] = normalized.get("created_at") or now
    normalized["updated_at"] = normalized.get("updated_at") or now
    return normalized


@router.post("", response_model=UserContextResponse)
def create_user_context(
    context: UserContextCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create or update user context and profile information.
    This serves as the foundation for personalization.
    """
    email = current_user.get("email")
    user_id = current_user.get("user_id")

    existing = user_context_collection.find_one({"email": email})

    context_data = _normalize_context_document({
        "user_id": user_id,
        "email": email,
        "background": context.background,
        "interests": context.interests or [],
        "career_goals": context.career_goals,
        "preferences": context.preferences or {},
        "availability_hours_per_week": context.availability_hours_per_week,
        "onboarding_completed": getattr(context, "onboarding_completed", None) or False,
        "onboarding_data": getattr(context, "onboarding_data", None),
        "last_skill_gap": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }, fallback_email=email, fallback_user_id=user_id)

    if existing:
        user_context_collection.update_one(
            {"email": email},
            {"$set": {**context_data, "created_at": existing.get("created_at")}}
        )
        context_data["created_at"] = existing.get("created_at") or context_data["created_at"]
    else:
        user_context_collection.insert_one(context_data)

    return UserContextResponse(**_normalize_context_document(context_data, fallback_email=email, fallback_user_id=user_id))


@router.get("", response_model=UserContextResponse)
def get_user_context(current_user: dict = Depends(get_current_user)):
    """Get current user's context and profile."""
    email = current_user.get("email")
    context = user_context_collection.find_one({"email": email})

    if not context:
        raise HTTPException(status_code=404, detail="User context not found")

    normalized = _normalize_context_document(
        context,
        fallback_email=email,
        fallback_user_id=current_user.get("user_id")
    )
    return UserContextResponse(**normalized)


@router.put("", response_model=UserContextResponse)
def update_user_context(
    context_update: UserContextUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user context and profile."""
    email = current_user.get("email")
    existing = user_context_collection.find_one({"email": email})

    if not existing:
        raise HTTPException(status_code=404, detail="User context not found")

    update_data = {}
    if context_update.background is not None:
        update_data["background"] = context_update.background
    if context_update.interests is not None:
        update_data["interests"] = context_update.interests
    if context_update.career_goals is not None:
        update_data["career_goals"] = context_update.career_goals
    if context_update.preferences is not None:
        update_data["preferences"] = context_update.preferences
    if context_update.availability_hours_per_week is not None:
        update_data["availability_hours_per_week"] = context_update.availability_hours_per_week
    if context_update.onboarding_completed is not None:
        update_data["onboarding_completed"] = context_update.onboarding_completed
    if context_update.onboarding_data is not None:
        update_data["onboarding_data"] = context_update.onboarding_data
    if context_update.last_skill_gap is not None:
        update_data["last_skill_gap"] = context_update.last_skill_gap

    update_data["updated_at"] = datetime.utcnow()

    user_context_collection.update_one(
        {"email": email},
        {"$set": update_data}
    )

    updated = user_context_collection.find_one({"email": email})
    normalized = _normalize_context_document(
        updated,
        fallback_email=email,
        fallback_user_id=current_user.get("user_id")
    )
    return UserContextResponse(**normalized)



