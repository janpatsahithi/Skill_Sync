import json
import time
from pathlib import Path
from typing import Any

from app.db.database import user_skills_collection

BASE_DIR = Path(__file__).resolve().parents[1]
FALLBACK_FILE = BASE_DIR / "datasets" / "fallback_roles.json"
CACHE_TTL_SECONDS = 600


def _normalize_key(value: str) -> str:
    text = (value or "").strip().lower()
    text = text.replace(".js", "")
    text = text.replace("nodejs", "node")
    text = text.replace("reactjs", "react")
    text = text.replace("rest apis", "rest api")
    text = "".join(ch if (ch.isalnum() or ch in {" ", "+", "#"}) else " " for ch in text)
    return " ".join(text.split())


def _display_skill(value: str) -> str:
    return " ".join(part.capitalize() for part in str(value).split())


class TargetRoleJobRecommendationService:
    """
    Role-constrained job recommendations aligned to curated Skill Gap roles.
    - Filters strictly by role_category from fallback_roles dataset.
    - Optionally narrows to a single selected role.
    - Caches recommendations per (user, role) for 10 minutes.
    """

    def __init__(self):
        self.roles = self._load_curated_roles()
        self.allowed_roles = sorted([r["role_category"] for r in self.roles])
        self.jobs_catalog = self._build_jobs_catalog(self.roles)
        self._cache: dict[tuple[str, str], dict[str, Any]] = {}

    def _load_curated_roles(self) -> list[dict[str, Any]]:
        try:
            with open(FALLBACK_FILE, encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            return []

        roles: list[dict[str, Any]] = []
        for role in data.get("roles", []):
            role_name = str(role.get("role", "")).strip()
            if not role_name:
                continue

            normalized_skills = []
            for item in role.get("skills", []):
                key = _normalize_key(str(item.get("name", "")))
                if key:
                    normalized_skills.append(key)

            if not normalized_skills:
                continue

            roles.append(
                {
                    "role_category": role_name.title(),
                    "required_skills": sorted(set(normalized_skills)),
                }
            )
        return roles

    def _build_jobs_catalog(self, roles: list[dict[str, Any]]) -> list[dict[str, Any]]:
        companies = [
            "TechCorp",
            "NextWave Labs",
            "CloudGrid Systems",
            "DataForge",
            "CoreStack",
            "Innovent",
        ]
        locations = ["Remote", "Bengaluru", "Hyderabad", "Pune", "Mumbai"]
        experience_levels = ["Entry", "Mid", "Associate"]

        jobs = []
        idx = 1
        for i, role in enumerate(roles):
            role_category = role["role_category"]
            required_skills = role["required_skills"]
            if not required_skills:
                continue

            # Keep one canonical job per role category for clean alignment.
            jobs.append(
                {
                    "job_id": idx,
                    "id": str(idx),  # backward-compatible key
                    "title": role_category,
                    "company": companies[i % len(companies)],
                    "role_category": role_category,
                    "description": f"{role_category} role focused on applied delivery and measurable outcomes.",
                    "required_skills": required_skills,
                    "location": locations[i % len(locations)],
                    "experience_level": experience_levels[i % len(experience_levels)],
                    "created_at": None,
                }
            )
            idx += 1
        return jobs

    def _extract_user_skills(self, email: str) -> set[str]:
        doc = user_skills_collection.find_one({"email": email}) or {}
        raw_skills = doc.get("skills", [])
        keys: set[str] = set()
        for skill in raw_skills:
            if isinstance(skill, dict):
                candidate = (
                    skill.get("normalized_key")
                    or skill.get("skill")
                    or skill.get("label")
                    or ""
                )
            else:
                candidate = str(skill)
            key = _normalize_key(str(candidate))
            if key:
                keys.add(key)
        return keys

    def _cache_get(self, email: str, role: str | None) -> dict[str, Any] | None:
        key = (email, (role or "__all__").strip().lower())
        entry = self._cache.get(key)
        if not entry:
            return None
        if (time.time() - entry["ts"]) > CACHE_TTL_SECONDS:
            self._cache.pop(key, None)
            return None
        return entry["payload"]

    def _cache_set(self, email: str, role: str | None, payload: dict[str, Any]) -> None:
        key = (email, (role or "__all__").strip().lower())
        self._cache[key] = {"ts": time.time(), "payload": payload}

    def recommend(self, email: str, selected_role: str | None = None) -> dict[str, Any]:
        cached = self._cache_get(email, selected_role)
        if cached is not None:
            return cached

        user_skills = self._extract_user_skills(email)
        selected_role_norm = (selected_role or "").strip().lower()
        allowed_role_set = {r.lower() for r in self.allowed_roles}

        if selected_role_norm and selected_role_norm not in allowed_role_set:
            payload = {
                "recommended_jobs": [],
                "allowed_roles": self.allowed_roles,
                "selected_role": selected_role,
                "message": "Selected role is not part of predefined target roles.",
            }
            self._cache_set(email, selected_role, payload)
            return payload

        # 1) Filter by role_category first.
        role_filtered = self.jobs_catalog
        if selected_role_norm:
            role_filtered = [
                job for job in self.jobs_catalog
                if job["role_category"].strip().lower() == selected_role_norm
            ]

        # 2) Prefilter by at least one overlapping skill.
        prefiltered = []
        for job in role_filtered:
            required = set(job.get("required_skills", []))
            overlap = user_skills & required
            if overlap:
                prefiltered.append((job, required, overlap))

        # 3) Compute match score only after prefilter.
        scored_jobs = []
        for job, required, overlap in prefiltered:
            total_required = len(required)
            if total_required == 0:
                continue
            score = round((len(overlap) / total_required) * 100.0, 2)
            scored_jobs.append(
                {
                    **job,
                    "match_score": score,
                    "matched_skills": sorted(_display_skill(s) for s in overlap),
                    "missing_skills": sorted(_display_skill(s) for s in (required - user_skills)),
                }
            )

        scored_jobs.sort(key=lambda item: item["match_score"], reverse=True)

        high_threshold = [j for j in scored_jobs if j["match_score"] >= 40.0]
        selected = high_threshold if high_threshold else [j for j in scored_jobs if j["match_score"] >= 30.0]
        top_jobs = selected[:10]

        payload = {
            "recommended_jobs": top_jobs,
            # Backward compatibility with current frontend mapper
            "jobs": top_jobs,
            "allowed_roles": self.allowed_roles,
            "selected_role": selected_role,
        }
        self._cache_set(email, selected_role, payload)
        return payload
