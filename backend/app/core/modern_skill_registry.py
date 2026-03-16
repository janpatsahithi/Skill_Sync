from __future__ import annotations

import json
import re
from pathlib import Path
from threading import Lock
from typing import Any


class ModernSkillRegistry:
    """
    Singleton modern-tech skill matcher using alias lookup.
    Loads dataset once per process and resolves aliases to canonical keys.
    """

    _instance: ModernSkillRegistry | None = None
    _lock: Lock = Lock()

    def __init__(self, dataset_path: Path | None = None) -> None:
        base_dir = Path(__file__).resolve().parents[1]
        path = dataset_path or (base_dir / "core" / "modern_tech_dataset.json")

        with open(path, encoding="utf-8") as f:
            self.dataset: dict[str, dict[str, list[str]]] = json.load(f)

        self.key_to_category: dict[str, str] = {}
        self.alias_to_key: dict[str, str] = {}
        self.key_to_label: dict[str, str] = {}
        self._build_indices()

    @classmethod
    def get_instance(cls) -> ModernSkillRegistry:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _build_indices(self) -> None:
        for category, mapping in self.dataset.items():
            if not isinstance(mapping, dict):
                continue
            for canonical_key, aliases in mapping.items():
                key = self._normalize_text(canonical_key)
                if not key:
                    continue
                self.key_to_category[key] = category
                self.key_to_label[key] = self._display_label(key)

                all_aliases = [canonical_key] + list(aliases or [])
                for alias in all_aliases:
                    norm_alias = self._normalize_text(alias)
                    if norm_alias:
                        self.alias_to_key[norm_alias] = key

    def match_modern_skill(self, candidate: str) -> dict[str, Any] | None:
        norm = self._normalize_text(candidate)
        if not norm:
            return None
        canonical_key = self.alias_to_key.get(norm)
        if not canonical_key:
            return None
        return {
            "normalized_key": canonical_key,
            "label": self.key_to_label.get(canonical_key, self._display_label(canonical_key)),
            "category": self.key_to_category.get(canonical_key, "other"),
            "source": "modern",
            "similarity": 1.0,
        }

    @staticmethod
    def _normalize_text(text: str) -> str:
        value = str(text or "").strip().lower()
        value = value.replace(".js", "")
        value = value.replace("nodejs", "node")
        value = value.replace("reactjs", "react")
        value = re.sub(r"[^a-z0-9\s\+#_]", " ", value)
        value = re.sub(r"\s+", " ", value).strip()
        return value

    @staticmethod
    def _display_label(key: str) -> str:
        mapping = {
            "cpp": "C++",
            "csharp": "C#",
            "nextjs": "Next.js",
            "postgresql": "PostgreSQL",
            "aws": "AWS",
            "gcp": "Google Cloud",
            "scikit_learn": "Scikit-learn",
            "machine_learning": "Machine Learning",
            "deep_learning": "Deep Learning",
            "linear_regression": "Linear Regression",
            "logistic_regression": "Logistic Regression",
            "rest_api": "REST API",
            "jwt": "JWT",
            "rag": "RAG",
            "chromadb": "ChromaDB",
            "oop": "Object Oriented Programming",
        }
        if key in mapping:
            return mapping[key]
        return " ".join(part.capitalize() for part in key.split("_"))
