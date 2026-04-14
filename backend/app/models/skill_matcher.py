# app/models/skill_matcher.py

from sentence_transformers import util
from app.core.skill_embedding_index import (
    get_skill_embedding_index
)
from app.core.canonical_skills import CANONICAL_SKILLS


SIMILARITY_THRESHOLD = 0.6


def match_to_canonical(skill: str) -> str | None:
    _model, CANONICAL_EMBEDDINGS = get_skill_embedding_index()
    user_vec = _model.encode(skill, normalize_embeddings=True)
    scores = util.cos_sim(user_vec, CANONICAL_EMBEDDINGS)[0]

    best_idx = int(scores.argmax())
    best_score = float(scores[best_idx])

    if best_score >= SIMILARITY_THRESHOLD:
        return CANONICAL_SKILLS[best_idx]

    return None
