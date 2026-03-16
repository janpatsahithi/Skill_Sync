from __future__ import annotations

import re

from app.core.skill_filter_loader import get_skill_filter_config


STRONG_TECH_KEYWORDS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "angular",
    "vue",
    "node",
    "express",
    "flask",
    "fastapi",
    "spring",
    "django",
    "html",
    "css",
    "tailwind",
    "mongodb",
    "mysql",
    "postgresql",
    "postgres",
    "redis",
    "sql",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "pandas",
    "numpy",
    "matplotlib",
    "seaborn",
    "machine learning",
    "linear regression",
    "logistic regression",
    "power bi",
    "git",
    "github",
    "postman",
    "rest api",
    "jwt",
    "rag",
    "chromadb",
    "backend",
    "frontend",
    "database",
    "ml",
    "ai",
}

RESUME_META_WORDS = {
    "summary",
    "professional",
    "experienced",
    "motivated",
    "passionate",
    "seeking",
    "developed",
    "built",
    "analysis",
    "dashboard",
    "platform",
    "guidance",
    "extraction",
    "college",
    "university",
    "bachelor",
    "cgpa",
    "india",
    "bengaluru",
    "udemy",
    "coursera",
    "foundations",
    "basics",
    "xyz",
}

GENERIC_PARENT_KEYS = {
    "computer programming",
    "software development",
    "database systems",
    "backend",
    "frontend",
}

DISPLAY_EXCLUDED_KEYS = {
    "computer programming",
    "software development",
    "e commerce systems",
    "use spreadsheets software",
    "advise on career",
    "dock operations",
    "visual studio net",
}


class SkillPostProcessor:
    """
    Canonicalizes extracted skills into stable keys and categories.
    """

    def __init__(self, min_similarity_keep: float = 0.70) -> None:
        self.min_similarity_keep = float(min_similarity_keep)
        cfg = get_skill_filter_config()
        self.categories = cfg.categories
        self.canonical_map = cfg.canonical_map
        self.tech_mode = cfg.tech_mode
        self._last_full_skill_list: list[dict] = []

    def process(self, skills: list[dict]) -> dict[str, list[dict]]:
        if not skills:
            self._last_full_skill_list = []
            return {"full_skills": [], "display_skills": []}

        dedup_by_key: dict[str, dict] = {}
        for skill in skills:
            if not isinstance(skill, dict):
                continue

            raw_label = str(skill.get("label", "")).strip()
            if self._should_drop(raw_label):
                continue

            source = self._source_of(skill)
            similarity = self._to_float(skill.get("similarity", 0.0))
            has_tech_keyword = self._has_strong_tech_keyword(raw_label)

            # Keep logic from current tech-focused mode.
            keep = (source == "esco") or (similarity >= self.min_similarity_keep) or has_tech_keyword
            if self.tech_mode and not keep:
                continue

            normalized_key = self._normalized_key(raw_label)
            if not normalized_key:
                continue

            canonical = self.canonical_map.get(normalized_key)
            if canonical:
                label = canonical["label"]
                category = canonical["category"]
            else:
                label = self._title_label(normalized_key)
                category = "other"

            item = {
                "normalized_key": normalized_key,
                "label": label,
                "category": category,
                "source": source,
                "similarity": similarity,
                "confidence": similarity,
                "section": str(skill.get("section", "other")),
                "uri": skill.get("uri"),
            }

            prev = dedup_by_key.get(normalized_key)
            if prev is None:
                dedup_by_key[normalized_key] = item
            else:
                dedup_by_key[normalized_key] = self._prefer(prev, item)

        result = list(dedup_by_key.values())
        result = self._remove_generic_parent_esco_skills(result)
        result.sort(
            key=lambda s: (
                0 if s.get("source") == "esco" else 1,
                -self._to_float(s.get("confidence", 0.0)),
            )
        )

        # Keep full internal list for downstream logic (e.g., gap analysis).
        full_skill_list = [dict(item) for item in result]
        self._last_full_skill_list = full_skill_list

        # Display filter for UI.
        display_skills = self.build_display_skills(full_skill_list)
        return {
            "full_skills": full_skill_list,
            "display_skills": display_skills,
        }

    def get_full_skill_list(self) -> list[dict]:
        return [dict(item) for item in self._last_full_skill_list]

    def build_display_skills(self, skills: list[dict]) -> list[dict]:
        # Display-only candidate pool: keep full list untouched for DB/gap logic.
        display_pool: list[dict] = []
        for s in skills:
            normalized_key = str(s.get("normalized_key", "")).strip().lower()
            if normalized_key in DISPLAY_EXCLUDED_KEYS:
                continue

            item = dict(s)
            item["priority_score"] = self._compute_priority_score(item)
            display_pool.append(item)

        # Rank by priority_score descending and keep top 10 core skills.
        ranked = sorted(display_pool, key=lambda x: self._to_float(x.get("priority_score", 0.0)), reverse=True)
        top_10_skills = ranked[:10]
        return top_10_skills

    def _compute_priority_score(self, skill: dict) -> float:
        """
        Priority ranking for UI display only.
        Higher score means stronger core technical importance.
        """
        score = self._to_float(skill.get("similarity", 0.0))
        category = str(skill.get("category", "other")).strip().lower()
        source = str(skill.get("source", "modern")).strip().lower()

        if category in {"programming_languages", "backend_frameworks", "frontend_frameworks"}:
            score += 3
        elif category in {"databases", "data_ai"}:
            score += 2
        elif category in {"devops_cloud", "tools", "concepts"}:
            score += 1

        if source == "modern":
            score += 1

        return score

    def _remove_generic_parent_esco_skills(self, skills: list[dict]) -> list[dict]:
        if not skills:
            return []

        # Track whether a category has any non-parent child skill.
        has_child_by_category: dict[str, bool] = {}
        for s in skills:
            category = str(s.get("category", "other")).strip().lower()
            key = str(s.get("normalized_key", "")).strip().lower()
            if key and key not in GENERIC_PARENT_KEYS:
                has_child_by_category[category] = True

        filtered: list[dict] = []
        for s in skills:
            source = str(s.get("source", "")).strip().lower()
            key = str(s.get("normalized_key", "")).strip().lower()
            category = str(s.get("category", "other")).strip().lower()

            # Remove parent only for ESCO skills when a child exists in the same category.
            if source == "esco" and key in GENERIC_PARENT_KEYS and has_child_by_category.get(category, False):
                continue
            filtered.append(s)

        return filtered

    def _should_drop(self, label: str) -> bool:
        normalized = self._normalize_label(label)
        if not normalized:
            return True
        if any(word in normalized for word in RESUME_META_WORDS):
            return True
        if normalized.isdigit():
            return True
        if len(normalized) < 3:
            return True
        if re.fullmatch(r"(19|20)\d{2}(?:\s+(19|20)\d{2})*", normalized):
            return True
        return False

    def _normalized_key(self, label: str) -> str:
        value = self._normalize_label(label)
        value = value.replace(".js", "")
        value = value.replace("nodejs", "node")
        value = value.replace("reactjs", "react")
        value = value.replace("rest apis", "rest api")
        value = value.replace("tailwind css", "tailwind")
        value = re.sub(r"[^a-z0-9\s\+#]", " ", value)
        value = re.sub(r"\s+", " ", value).strip()
        return value

    def _has_strong_tech_keyword(self, label: str) -> bool:
        normalized = self._normalized_key(label)
        return any(keyword in normalized for keyword in STRONG_TECH_KEYWORDS)

    def _prefer(self, a: dict, b: dict) -> dict:
        a_source = str(a.get("source", "modern"))
        b_source = str(b.get("source", "modern"))
        if a_source != b_source:
            order = {"esco": 0, "modern": 1, "fallback": 2}
            return a if order.get(a_source, 3) <= order.get(b_source, 3) else b
        return a if self._to_float(a.get("similarity")) >= self._to_float(b.get("similarity")) else b

    def _source_of(self, skill: dict) -> str:
        source = str(skill.get("source", "")).strip().lower()
        if source in {"esco", "modern", "fallback"}:
            return source
        return "esco" if skill.get("uri") else "modern"

    @staticmethod
    def _normalize_label(text: str) -> str:
        value = str(text or "").strip().lower()
        value = re.sub(r"[^\w\s\+#\.]", " ", value)
        value = re.sub(r"\s+", " ", value).strip()
        return value

    @staticmethod
    def _title_label(normalized_key: str) -> str:
        if normalized_key in {"sql", "jwt", "rag", "ai", "ml", "aws", "gcp", "css", "html"}:
            return normalized_key.upper()
        return " ".join(part.capitalize() for part in normalized_key.split())

    @staticmethod
    def _to_float(value: object) -> float:
        try:
            return float(value)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return 0.0
