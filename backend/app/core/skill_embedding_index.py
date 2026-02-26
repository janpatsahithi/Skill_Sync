# app/core/skill_embedding_index.py

from sentence_transformers import SentenceTransformer
import numpy as np
from app.core.canonical_skills import CANONICAL_SKILLS

_model = SentenceTransformer("all-MiniLM-L6-v2")

CANONICAL_EMBEDDINGS = _model.encode(
    CANONICAL_SKILLS,
    normalize_embeddings=True
)
