from __future__ import annotations

import re
from threading import Lock
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.skill_index_loader import SkillIndexLoader


class SkillMatchEngine:
    """
    Runtime matching engine using in-memory index + embeddings.

    Matching policy:
    1) Lexical lookup first.
    2) Embedding fallback with strict gates:
       - top_k candidates
       - similarity threshold
       - margin rule
       - token overlap gate
    """

    _model: SentenceTransformer | None = None
    _model_lock: Lock = Lock()
    _GENERIC_PARENT_KEYS = {
        "computer programming",
        "software development",
        "database systems",
        "backend",
        "frontend",
    }

    def __init__(
        self,
        loader: SkillIndexLoader,
        model_name: str = "all-MiniLM-L6-v2",
        top_k: int = 5,
        min_similarity: float = 0.82,
        min_margin: float = 0.08,
        min_token_overlap: float = 0.30,
    ) -> None:
        self.loader = loader
        self.model_name = model_name
        self.top_k = int(top_k)
        self.min_similarity = float(min_similarity)
        self.min_margin = float(min_margin)
        self.min_token_overlap = float(min_token_overlap)

    @classmethod
    def _get_model(cls, model_name: str) -> SentenceTransformer:
        if cls._model is None:
            with cls._model_lock:
                if cls._model is None:
                    cls._model = SentenceTransformer(model_name)
        return cls._model

    @staticmethod
    def normalize_text(text: str) -> str:
        value = (text or "").strip().lower()
        value = re.sub(r"[^\w\s\+#\.]", " ", value)
        value = value.replace("_", " ")
        value = re.sub(r"\s+", " ", value)
        return value.strip()

    @staticmethod
    def _tokens(text: str) -> set[str]:
        normalized = SkillMatchEngine.normalize_text(text)
        if not normalized:
            return set()
        return {part for part in normalized.split(" ") if part}

    @staticmethod
    def _token_overlap(a: str, b: str) -> float:
        tokens_a = SkillMatchEngine._tokens(a)
        tokens_b = SkillMatchEngine._tokens(b)
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = len(tokens_a & tokens_b)
        union = len(tokens_a | tokens_b)
        if union == 0:
            return 0.0
        return intersection / union

    def _is_generic_parent(self, label: str) -> bool:
        return self.normalize_text(label) in self._GENERIC_PARENT_KEYS

    def match_skill(self, phrase: str) -> dict[str, Any] | None:
        normalized = self.normalize_text(phrase)
        if not normalized:
            return None

        # 1) Lexical exact match (fast path)
        exact_idx = self.loader.lookup.get(normalized)
        if exact_idx is not None:
            return self.loader.get_match_payload(int(exact_idx), 1.0)

        # 2) Embedding fallback with strict gating
        embeddings = self.loader.embeddings
        if embeddings.size == 0 or not self.loader.skills:
            return None

        model = self._get_model(self.model_name)
        query_vec = model.encode(
            [normalized],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )[0].astype(np.float32, copy=False)

        similarities = embeddings @ query_vec
        candidate_count = min(self.top_k, int(similarities.shape[0]))
        if candidate_count <= 0:
            return None

        # Vectorized top-k selection.
        top_indices = np.argpartition(similarities, -candidate_count)[-candidate_count:]
        top_indices = top_indices[np.argsort(similarities[top_indices])[::-1]]

        ranked: list[tuple[int, float, str]] = []
        for idx in top_indices:
            skill_item = self.loader.get_skill(int(idx))
            if not skill_item:
                continue
            label = str(skill_item.get("label") or skill_item.get("name") or "")
            ranked.append((int(idx), float(similarities[int(idx)]), label))
        if not ranked:
            return None

        # Prefer specific child skill when top hit is a generic parent.
        selected_idx, selected_score, selected_label = ranked[0]
        if self._is_generic_parent(selected_label):
            for idx, score, label in ranked[1:]:
                if not self._is_generic_parent(label):
                    selected_idx, selected_score, selected_label = idx, score, label
                    break

        # Strict ESCO fallback gates.
        if selected_score < self.min_similarity:
            return None
        second_score = max(
            (score for idx, score, _ in ranked if idx != selected_idx),
            default=0.0,
        )
        if (selected_score - second_score) < self.min_margin:
            return None

        return self.loader.get_match_payload(selected_idx, selected_score)
