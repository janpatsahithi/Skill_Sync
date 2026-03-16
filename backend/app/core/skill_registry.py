from __future__ import annotations

from pathlib import Path
from threading import Lock
from typing import Any

from app.core.skill_index_loader import SkillIndexLoader
from app.core.skill_match_engine import SkillMatchEngine


class SkillRegistry:
    """
    Thread-safe singleton facade for runtime skill matching.

    Responsibilities:
    - Lazy initialization
    - Single index loader instance
    - Single model-backed match engine per process
    """

    _instance: SkillRegistry | None = None
    _lock: Lock = Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> SkillRegistry:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False  # type: ignore[attr-defined]
        return cls._instance

    def __init__(
        self,
        base_dir: Path | None = None,
        model_name: str = "all-MiniLM-L6-v2",
        top_k: int = 5,
        min_similarity: float = 0.60,
        min_margin: float = 0.08,
        min_token_overlap: float = 0.30,
    ) -> None:
        if getattr(self, "_initialized", False):
            return

        self.loader = SkillIndexLoader.get_instance() if base_dir is None else SkillIndexLoader(base_dir=base_dir)
        self.engine = SkillMatchEngine(
            loader=self.loader,
            model_name=model_name,
            top_k=top_k,
            min_similarity=min_similarity,
            min_margin=min_margin,
            min_token_overlap=min_token_overlap,
        )
        self._initialized = True

    @classmethod
    def get_instance(cls) -> SkillRegistry:
        return cls()

    def match_skill(self, phrase: str) -> dict[str, Any] | None:
        return self.engine.match_skill(phrase)
