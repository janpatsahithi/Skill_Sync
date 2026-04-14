# app/core/skill_embedding_index.py

from sentence_transformers import SentenceTransformer
from app.core.canonical_skills import CANONICAL_SKILLS

_model = None
CANONICAL_EMBEDDINGS = None

def get_skill_embedding_index():
    global _model, CANONICAL_EMBEDDINGS
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        CANONICAL_EMBEDDINGS = _model.encode(CANONICAL_SKILLS, normalize_embeddings=True)
    return _model, CANONICAL_EMBEDDINGS
