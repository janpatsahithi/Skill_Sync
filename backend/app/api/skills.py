from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.core.deps import get_current_user
from app.db.database import user_skills_collection

from app.models.skill_extractor import SkillExtractor
from app.models.skill_postprocessor import SkillPostProcessor
from app.schemas import SkillExtractRequest, SkillGapRequest, OccupationResponse

from app.services.skill_gap_service import compute_skill_gap
from app.services.job_role_service import get_valid_occupations


router = APIRouter(prefix="/skills", tags=["Skills"])

# Instantiate ONCE (good practice)
extractor = SkillExtractor()
postprocessor = SkillPostProcessor()


# -----------------------------
# SKILL EXTRACTION
# -----------------------------
@router.post("/extract")
def extract_skills(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    # Accept either { "resume_text": "..." } or { "text": "..." }
    resume_text = (payload.get("resume_text") or payload.get("text") or "").strip()
    email = current_user.get("email")

    if not resume_text:
        return {
            "email": email,
            "skills": [],
            "total_skills": 0
        }

    # 1️⃣ Extract raw skills (ESCO + NLP)
    raw_skills = extractor.extract_skills(resume_text)

    # 2️⃣ Clean + deduplicate (CANONICAL)
    processed_result = postprocessor.process(raw_skills)
    full_processed = processed_result["full_skills"]
    display_processed = processed_result["display_skills"]
    skills = [
        {
            "skill": str(item.get("label", "")).lower().strip(),
            "normalized_key": str(item.get("normalized_key", "")).strip(),
            "label": str(item.get("label", "")).strip(),
            "category": str(item.get("category", "other")).strip(),
            "uri": item.get("uri"),
            "confidence": round(float(item.get("confidence", item.get("similarity", 0.0))), 3),
            "similarity": round(float(item.get("similarity", 0.0)), 3),
            "source": str(item.get("source", "esco" if item.get("uri") else "fallback")),
            "section": str(item.get("section", "other")),
        }
        for item in display_processed
        if item.get("label")
    ]

    full_skills = [
        {
            "skill": str(item.get("label", "")).lower().strip(),
            "normalized_key": str(item.get("normalized_key", "")).strip(),
            "label": str(item.get("label", "")).strip(),
            "category": str(item.get("category", "other")).strip(),
            "uri": item.get("uri"),
            "confidence": round(float(item.get("confidence", item.get("similarity", 0.0))), 3),
            "similarity": round(float(item.get("similarity", 0.0)), 3),
            "source": str(item.get("source", "esco" if item.get("uri") else "fallback")),
            "section": str(item.get("section", "other")),
        }
        for item in full_processed
        if item.get("label")
    ]

    # 3️⃣ Store in DB
    user_skills_collection.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "skills": full_skills,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    return {
        "email": email,
        "skills": skills,
        "total_skills": len(skills)
    }


# -----------------------------
# SKILL GAP ANALYSIS
# -----------------------------
@router.post("/gap")
def skill_gap_analysis(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Supports multiple payloads from frontend:
      - { "occupation_uri": "..." }  (uses stored user skills)
      - { "occupation": "..." }
      - { "current_skills": [...], "target_skills": [...] }
    """
    email = current_user.get("email")

    # -----------------------------
    # Normalize occupation_uri
    # -----------------------------
    occupation_uri = payload.get("occupation_uri") or payload.get("occupation")

    if isinstance(occupation_uri, list):
        if not occupation_uri:
            raise HTTPException(status_code=400, detail="Invalid occupation")
        occupation_uri = occupation_uri[0]

    if occupation_uri and not isinstance(occupation_uri, str):
        raise HTTPException(status_code=400, detail="Invalid occupation format")

    # -----------------------------
    # Case 1: occupation only
    # -----------------------------
    if occupation_uri:
        user_data = user_skills_collection.find_one({"email": email})

        if not user_data or not user_data.get("skills"):
            raise HTTPException(
                status_code=400,
                detail="No extracted skills found for user"
            )

        user_skill_names = [s["skill"] for s in user_data["skills"]]

        return compute_skill_gap(
            user_skills=user_skill_names,
            occupation_uri=occupation_uri
        )

    # -----------------------------
    # Case 2: current_skills + target_occupation
    # -----------------------------
    current_skills = payload.get("current_skills") or payload.get("currentSkills")
    target_occupation = payload.get("target_occupation") or payload.get("targetOccupation")

    if current_skills and target_occupation:
        return compute_skill_gap(
            user_skills=current_skills,
            occupation_uri=target_occupation
        )

    # -----------------------------
    # Case 3: basic diff
    # -----------------------------
    target_skills = payload.get("target_skills") or payload.get("targetSkills")
    if current_skills and target_skills:
        current = set(current_skills)
        target = set(target_skills)
        covered = sorted(current & target)
        missing = sorted(target - current)

        return {
            "readiness_score": round(len(covered) / len(target) if target else 1, 2),
            "covered_skills": covered,
            "missing_skills": missing
        }

    raise HTTPException(status_code=400, detail="Invalid payload for skill gap analysis")

# -----------------------------
# GET CURRENT USER'S SKILLS (from DB)
# -----------------------------
@router.get("/me")
def get_my_skills(current_user: dict = Depends(get_current_user)):
    """Return the current user's stored skills from the database."""
    email = current_user.get("email")
    data = user_skills_collection.find_one({"email": email})
    if not data or not data.get("skills"):
        return {"skills": [], "total_skills": 0}
    display_skills = postprocessor.build_display_skills(data["skills"])
    return {"skills": display_skills, "total_skills": len(display_skills)}


# -----------------------------
# LIST OCCUPATIONS
# -----------------------------
@router.get("/occupations", response_model=list[OccupationResponse])
def list_occupations():
    """Public endpoint: list occupations without requiring authentication."""
    return get_valid_occupations()


# -----------------------------
# DEBUG ENDPOINT (OPTIONAL)
# -----------------------------
@router.post("/debug/gap")
def debug_skill_gap(
    payload: SkillGapRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Debug endpoint to inspect skill-gap internals
    """
    occupation_uri = payload.occupation_uri.strip()
    email = current_user.get("email")

    user_data = user_skills_collection.find_one({"email": email})

    if not user_data or not user_data.get("skills"):
        return {
            "error": "No extracted skills found for user"
        }

    user_skills = {s["skill"] for s in user_data["skills"]}

    from app.core.canonical_skill_store import CANONICAL_OCCUPATION_SKILLS

    job = CANONICAL_OCCUPATION_SKILLS.get(occupation_uri)

    if not job:
        return {"error": "Unknown occupation"}

    essential = set(job["essential"])
    optional = set(job["optional"])

    return {
        "occupation_uri": occupation_uri,
        "user_skills_count": len(user_skills),
        "essential_required": len(essential),
        "optional_required": len(optional),
        "matched_skills": sorted(user_skills & (essential | optional)),
        "missing_essential": sorted(essential - user_skills),
        "missing_optional": sorted(optional - user_skills),
    }
# -----------------------------
# CHECK IF USER HAS UPLOADED RESUME
# -----------------------------
@router.get("/has-resume")
def has_resume(current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user_data = user_skills_collection.find_one({"email": email})

    return {
        "has_resume": bool(user_data and user_data.get("skills"))
    }
