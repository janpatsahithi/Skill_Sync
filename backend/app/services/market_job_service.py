import os
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any

import requests

from app.core.canonical_skills import CANONICAL_SKILLS
from app.db.database import market_skill_trends_collection


_DEFAULT_LOCATION = "United States"
_DEFAULT_COUNTRY = "us"
_ROLE_DEFAULTS = [
    "Data Analyst",
    "Data Scientist",
    "Software Engineer",
    "Machine Learning Engineer",
    "Business Analyst",
]

_LOCATION_COUNTRY_MAP = {
    "india": "in",
    "united states": "us",
    "usa": "us",
    "uk": "gb",
    "united kingdom": "gb",
    "canada": "ca",
    "australia": "au",
}


class MarketJobService:
    """
    Real-market job integration (Adzuna API) with safe fallbacks.
    If credentials/network are unavailable, methods return empty market data
    without breaking existing gap-analysis flows.
    """

    def __init__(self):
        self.app_id = os.getenv("ADZUNA_APP_ID", "").strip()
        self.app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
        self.default_country = os.getenv("ADZUNA_COUNTRY", _DEFAULT_COUNTRY).strip().lower()
        self.timeout_seconds = int(os.getenv("MARKET_API_TIMEOUT_SECONDS", "8"))

    def has_credentials(self) -> bool:
        return bool(self.app_id and self.app_key)

    def fetch_jobs(
        self,
        role: str,
        location: str = _DEFAULT_LOCATION,
        results_per_page: int = 30,
    ) -> list[dict[str, Any]]:
        if not role or not self.has_credentials():
            return []

        country = self._resolve_country(location)
        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": max(1, min(results_per_page, 50)),
            "what": role,
            "where": location,
            "content-type": "application/json",
        }

        try:
            response = requests.get(url, params=params, timeout=self.timeout_seconds)
            response.raise_for_status()
            data = response.json() or {}
            return data.get("results", []) or []
        except Exception:
            return []

    def get_market_trends(
        self,
        role: str,
        location: str = _DEFAULT_LOCATION,
        top_k: int = 10,
        force_refresh: bool = False,
    ) -> dict[str, Any]:
        normalized_role = self._normalize_role(role)
        normalized_location = (location or _DEFAULT_LOCATION).strip()

        if not force_refresh:
            cached = self._read_cached_trends(normalized_role, normalized_location)
            if cached:
                return cached

        jobs = self.fetch_jobs(normalized_role, normalized_location)
        trending = self.extract_skill_frequencies(jobs, top_k=top_k)

        result = {
            "role": normalized_role,
            "location": normalized_location,
            "top_skills": trending["top_skills"],
            "total_jobs_analyzed": trending["total_jobs_analyzed"],
            "data_source": "adzuna" if self.has_credentials() else "unavailable",
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
        self._write_cached_trends(result)
        return result

    def get_trending_roles(
        self,
        location: str = _DEFAULT_LOCATION,
        roles: list[str] | None = None,
    ) -> dict[str, Any]:
        role_list = roles or _ROLE_DEFAULTS
        output: list[dict[str, Any]] = []
        for role in role_list:
            jobs = self.fetch_jobs(role=role, location=location, results_per_page=20)
            output.append(
                {
                    "role": role,
                    "job_postings_found": len(jobs),
                    "market_activity_score": min(len(jobs) * 5, 100),
                }
            )

        output.sort(key=lambda x: x["job_postings_found"], reverse=True)
        return {
            "location": location,
            "roles": output,
            "data_source": "adzuna" if self.has_credentials() else "unavailable",
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    def extract_skill_frequencies(
        self,
        jobs: list[dict[str, Any]],
        top_k: int = 10,
    ) -> dict[str, Any]:
        all_skills: list[str] = []
        for job in jobs:
            text = " ".join(
                [
                    str(job.get("title") or ""),
                    str(job.get("description") or ""),
                ]
            ).lower()
            if not text.strip():
                continue
            all_skills.extend(self._extract_skills_from_text(text))

        counter = Counter(all_skills)
        total_jobs = max(len(jobs), 1)
        top = counter.most_common(max(1, top_k))
        top_skills = [
            {
                "skill": skill,
                "frequency": count,
                "demand_pct": round((count / total_jobs) * 100, 1),
            }
            for skill, count in top
        ]
        return {
            "top_skills": top_skills,
            "total_jobs_analyzed": len(jobs),
        }

    def _extract_skills_from_text(self, text: str) -> list[str]:
        matches = []
        for skill in CANONICAL_SKILLS:
            if self._contains_skill(text, skill):
                matches.append(skill)
        return matches

    def _contains_skill(self, text: str, skill: str) -> bool:
        skill = skill.lower().strip()
        if not skill:
            return False

        if " " in skill:
            return skill in text

        return bool(re.search(rf"\b{re.escape(skill)}\b", text))

    def _resolve_country(self, location: str) -> str:
        key = (location or "").strip().lower()
        if key in _LOCATION_COUNTRY_MAP:
            return _LOCATION_COUNTRY_MAP[key]
        return self.default_country or _DEFAULT_COUNTRY

    def _normalize_role(self, role: str) -> str:
        if not role:
            return ""

        value = role.strip()
        if value.startswith("fallback://role/"):
            value = value.replace("fallback://role/", "", 1)
        if "/" in value:
            value = value.split("/")[-1]
        value = value.replace("-", " ").replace("_", " ").strip()
        return " ".join(w.capitalize() for w in value.split())

    def _read_cached_trends(self, role: str, location: str) -> dict[str, Any] | None:
        try:
            doc = market_skill_trends_collection.find_one(
                {"role": role, "location": location},
                sort=[("last_updated", -1)],
            )
            if not doc:
                return None
            return {
                "role": doc.get("role", role),
                "location": doc.get("location", location),
                "top_skills": doc.get("top_skills", []),
                "total_jobs_analyzed": doc.get("total_jobs_analyzed", 0),
                "data_source": doc.get("data_source", "cache"),
                "last_updated": doc.get("last_updated"),
            }
        except Exception:
            return None

    def _write_cached_trends(self, payload: dict[str, Any]) -> None:
        try:
            market_skill_trends_collection.update_one(
                {"role": payload["role"], "location": payload["location"]},
                {"$set": payload},
                upsert=True,
            )
        except Exception:
            return

