from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any

import numpy as np


ESCO_SKILL_PREFIX = "http://data.europa.eu/esco/skill/"


class SkillIndexLoader:
    """
    Loads preprocessed skill index artifacts once per process.

    Source files:
    - skill_index.json
    - skill_embeddings.npy
    - skill_lookup.json
    """

    _instance: SkillIndexLoader | None = None
    _lock: Lock = Lock()

    def __init__(self, base_dir: Path | None = None) -> None:
        root = base_dir or Path(__file__).resolve().parents[1]
        index_dir = root / "core" / "skill_index"

        index_path = index_dir / "skill_index.json"
        emb_path = index_dir / "skill_embeddings.npy"
        lookup_path = index_dir / "skill_lookup.json"

        with open(index_path, encoding="utf-8") as f:
            payload = json.load(f)

        if isinstance(payload, dict):
            self.skills: list[dict[str, Any]] = payload.get("skills", [])
        elif isinstance(payload, list):
            # Legacy compatibility.
            self.skills = payload
        else:
            self.skills = []

        with open(lookup_path, encoding="utf-8") as f:
            raw_lookup = json.load(f)
        self.lookup: dict[str, int] = {str(k): int(v) for k, v in raw_lookup.items()}

        embeddings = np.load(emb_path)
        if embeddings.ndim != 2:
            embeddings = np.atleast_2d(embeddings)
        self.embeddings: np.ndarray = embeddings.astype(np.float32, copy=False)

        self.uri_to_label: dict[str, str] = {}
        for item in self.skills:
            uri = item.get("uri")
            label = item.get("label") or item.get("name")
            if uri and label:
                self.uri_to_label[str(uri).strip()] = str(label).strip()

    @classmethod
    def get_instance(cls) -> SkillIndexLoader:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def get_skill(self, idx: int) -> dict[str, Any] | None:
        if idx < 0 or idx >= len(self.skills):
            return None
        return self.skills[idx]

    def get_match_payload(self, idx: int, similarity: float) -> dict[str, Any] | None:
        item = self.get_skill(idx)
        if not item:
            return None
        uri = item.get("uri")
        label = item.get("label") or item.get("name")
        if not uri or not label:
            return None
        return {
            "uri": str(uri),
            "label": str(label),
            "similarity": float(similarity),
        }


def normalize_skill_uri(skill: str) -> str:
    """
    Ensures skill is a full ESCO URI.
    """
    value = (skill or "").strip()
    if value.startswith("http"):
        return value
    return ESCO_SKILL_PREFIX + value


def uri_to_name(skill: str) -> str:
    """
    Converts skill URI/UUID to readable label using loaded index.
    """
    uri = normalize_skill_uri(skill)
    loader = SkillIndexLoader.get_instance()
    return loader.uri_to_label.get(uri, uri.split("/")[-1])
