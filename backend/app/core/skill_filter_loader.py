from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any


class SkillFilterConfig:
    """
    Loads canonical skill filter config and exposes a flattened canonical map.
    """

    _instance: SkillFilterConfig | None = None
    _lock: Lock = Lock()

    def __init__(self, config_path: Path | None = None) -> None:
        base_dir = Path(__file__).resolve().parents[1]
        path = config_path or (base_dir / "core" / "skill_filter_config.json")

        with open(path, encoding="utf-8") as f:
            payload = json.load(f)

        self.tech_mode: bool = bool(payload.get("tech_mode", True))
        self.categories: dict[str, dict[str, str]] = payload.get("categories", {})
        self.canonical_map: dict[str, dict[str, str]] = self._build_canonical_map(self.categories)

    @classmethod
    def get_instance(cls) -> SkillFilterConfig:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    @staticmethod
    def _build_canonical_map(categories: dict[str, dict[str, str]]) -> dict[str, dict[str, str]]:
        flat: dict[str, dict[str, str]] = {}
        for category, mapping in categories.items():
            if not isinstance(mapping, dict):
                continue
            for normalized_key, display_label in mapping.items():
                key = str(normalized_key).strip().lower()
                if not key:
                    continue
                flat[key] = {
                    "label": str(display_label).strip(),
                    "category": str(category).strip(),
                }
        return flat


def get_skill_filter_config() -> SkillFilterConfig:
    return SkillFilterConfig.get_instance()
