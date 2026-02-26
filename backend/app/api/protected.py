from fastapi import APIRouter, Depends
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/profile")
def profile(user=Depends(get_current_user)):
    return {
        "message": "Access granted",
        "user": user
    }
