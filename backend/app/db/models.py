from datetime import datetime
from typing import List
from pydantic import BaseModel


class SkillItem(BaseModel):
    skill: str
    uri: str
    confidence: float


class UserSkills(BaseModel):
    user_id: str | None
    email: str
    skills: List[SkillItem]
    updated_at: datetime
