from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_reasoner import generate_learning_path

router = APIRouter(prefix="/learning", tags=["Learning"])

class LearningRequest(BaseModel):
    occupation: str
    missing_skills: list[str]

@router.post("/path")
def learning_path(req: LearningRequest):
    return generate_learning_path(req.occupation, req.missing_skills)
