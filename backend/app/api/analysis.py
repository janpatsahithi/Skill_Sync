from fastapi import APIRouter, HTTPException
from typing import Any
from app.services.simple_skill_gap_service import compute_skill_gap

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/gap")
def analysis_gap(payload: dict[str, Any]):
    """
    Accepts either:
      - { "occupation_uri": "...", "current_skills": [ ... ] }  OR
      - { "occupation": "...", "current_skills": [ ... ] }     OR
      - { "current_skills": [...], "target_occupation": "..." }

    If only occupation is provided, the service expects `current_skills` to be passed.
    """
    # normalize payload keys
    occupation = (
        payload.get("occupation_uri")
        or payload.get("occupation")
        or payload.get("target_occupation")
    )

    current_skills = payload.get("current_skills") or payload.get("currentSkills")

    if not occupation or not current_skills:
        raise HTTPException(status_code=400, detail="Missing occupation or current_skills")

    return compute_skill_gap(user_skills=current_skills, occupation=occupation)
