from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.deps import get_current_user
from app.db.database import get_db
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
import pdfplumber
import docx
from app.models.skill_extractor import SkillExtractor
from app.models.skill_postprocessor import SkillPostProcessor

router = APIRouter()

# Instantiate extractor once
extractor = SkillExtractor()
postprocessor = SkillPostProcessor()


def extract_text(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    filename_lower = file.filename.lower()
    
    if filename_lower.endswith(".pdf"):
        text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text

    elif filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
        try:
            document = docx.Document(file.file)
            return "\n".join([para.text for para in document.paragraphs])
        except Exception:
            if filename_lower.endswith(".doc"):
                raise HTTPException(
                    status_code=400,
                    detail="Legacy .doc files are not supported. Please upload a PDF or DOCX file."
                )
            raise HTTPException(
                status_code=400,
                detail="Could not read this Word file. Please upload a valid DOCX or PDF file."
            )

    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOC/DOCX file.")


@router.post("/upload")
def upload_resume(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    text = extract_text(file)
    resume_collection = db["resumes"]
    user_skills_collection = db["user_skills"]

    # Extract + post-process skills
    raw_skills = extractor.extract_skills(text)
    processed_result = postprocessor.process(raw_skills)
    full_processed = processed_result["full_skills"]
    display_processed = processed_result["display_skills"]

    display_skills = [
        {
            "skill": str(item.get("label", "")).lower().strip(),  # backward compatibility
            "normalized_key": str(item.get("normalized_key", "")).strip(),
            "label": str(item.get("label", "")).strip(),
            "category": str(item.get("category", "other")).strip(),
            "uri": item.get("uri"),
            "confidence": round(float(item.get("confidence", item.get("similarity", 0.0))), 3),  # backward compatibility
            "similarity": round(float(item.get("similarity", 0.0)), 3),
            "source": str(item.get("source", "esco" if item.get("uri") else "fallback")),
            "section": str(item.get("section", "other")),
        }
        for item in display_processed
        if item.get("label")
    ]

    full_skills = [
        {
            "skill": str(item.get("label", "")).lower().strip(),  # backward compatibility
            "normalized_key": str(item.get("normalized_key", "")).strip(),
            "label": str(item.get("label", "")).strip(),
            "category": str(item.get("category", "other")).strip(),
            "uri": item.get("uri"),
            "confidence": round(float(item.get("confidence", item.get("similarity", 0.0))), 3),  # backward compatibility
            "similarity": round(float(item.get("similarity", 0.0)), 3),
            "source": str(item.get("source", "esco" if item.get("uri") else "fallback")),
            "section": str(item.get("section", "other")),
        }
        for item in full_processed
        if item.get("label")
    ]

    esco_count = sum(1 for s in full_skills if s.get("source") == "esco")
    fallback_count = sum(1 for s in full_skills if s.get("source") == "fallback")
    print("\nFINAL SKILLS BEING SAVED:")
    print("Total:", len(full_skills))
    print("ESCO count:", esco_count)
    print("Fallback count:", fallback_count)

    resume_doc = {
        "user_id": user["user_id"],
        "email": user.get("email"),
        "filename": file.filename,
        "text": text,
        "file_size": len(text),  # Approximate size
        "skills_count": len(full_skills),
        "uploaded_at": datetime.utcnow()
    }

    result = resume_collection.insert_one(resume_doc)
    resume_id = str(result.inserted_id)

    # Hard overwrite existing user skills before saving latest extraction.
    user_skills_collection.delete_many(
        {
            "$or": [
                {"email": user.get("email")},
                {"user_id": user.get("user_id")},
            ]
        }
    )
    user_skills_collection.insert_one(
        {
            "email": user.get("email"),
            "user_id": user.get("user_id"),
            "skills": full_skills,
            "updated_at": datetime.utcnow(),
        }
    )

    return {
        "message": "Resume uploaded successfully",
        "filename": file.filename,
        "skills": display_skills,
        "resume_id": resume_id
    }


@router.get("/list")
def get_user_resumes(
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Get all resumes uploaded by the current user."""
    resume_collection = db["resumes"]
    user_id = user.get("user_id")
    
    resumes = list(resume_collection.find(
        {"user_id": user_id},
        {"text": 0}  # Exclude text content for list view
    ).sort("uploaded_at", -1))
    
    for resume in resumes:
        resume["id"] = str(resume["_id"])
        resume["_id"] = str(resume["_id"])
        resume["uploaded_at"] = resume["uploaded_at"].isoformat() if resume.get("uploaded_at") else None
    
    return {"resumes": resumes}


@router.get("/{resume_id}")
def get_resume_details(
    resume_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Get details of a specific resume."""
    resume_collection = db["resumes"]
    user_id = user.get("user_id")
    
    try:
        object_id = ObjectId(resume_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid resume ID format")
    
    resume = resume_collection.find_one({
        "_id": object_id,
        "user_id": user_id
    })
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume["id"] = str(resume["_id"])
    resume["_id"] = str(resume["_id"])
    resume["uploaded_at"] = resume["uploaded_at"].isoformat() if resume.get("uploaded_at") else None
    
    return resume


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """Delete a resume."""
    resume_collection = db["resumes"]
    user_id = user.get("user_id")
    
    try:
        object_id = ObjectId(resume_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid resume ID format")
    
    result = resume_collection.delete_one({
        "_id": object_id,
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {"message": "Resume deleted successfully"}
