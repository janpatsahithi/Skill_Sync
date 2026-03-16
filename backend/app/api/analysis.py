import json
import math
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.db.database import get_db
from app.services.simple_skill_gap_service import compute_skill_gap

router = APIRouter(prefix="/analysis", tags=["Analysis"])

BASE_DIR = Path(__file__).resolve().parents[1]
FALLBACK_FILE = BASE_DIR / "datasets" / "fallback_roles.json"


def _normalize_key(value: str) -> str:
    text = (value or "").strip().lower()
    text = text.replace(".js", "")
    text = text.replace("nodejs", "node")
    text = text.replace("reactjs", "react")
    text = text.replace("rest apis", "rest api")
    text = "".join(ch if (ch.isalnum() or ch in {" ", "+", "#"}) else " " for ch in text)
    return " ".join(text.split())


def _extract_user_skill_keys(user_skills: list) -> set[str]:
    keys: set[str] = set()
    for item in user_skills or []:
        if isinstance(item, dict):
            key = _normalize_key(str(item.get("normalized_key") or item.get("label") or item.get("skill") or ""))
        else:
            key = _normalize_key(str(item))
        if key:
            keys.add(key)
    return keys


def _load_curated_roles() -> list[dict[str, Any]]:
    try:
        with open(FALLBACK_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return []

    roles: list[dict[str, Any]] = []
    for role in data.get("roles", []):
        role_name = (role.get("role") or "").strip()
        if not role_name:
            continue
        role_uri = f"fallback://role/{role_name.lower().replace(' ', '-')}"
        skill_keys = []
        for s in role.get("skills", []):
            k = _normalize_key(str(s.get("name") or ""))
            if k:
                skill_keys.append(k)

        category = (role.get("category") or "general").strip().lower()
        roles.append(
            {
                "role": role_name.title(),
                "uri": role_uri,
                "category": category,
                "description": f"In-demand {category} role with practical skill focus.",
                "skill_keys": list(sorted(set(skill_keys))),
            }
        )
    return roles


def _cosine_set_similarity(user_keys: set[str], required_keys: set[str]) -> float:
    if not user_keys or not required_keys:
        return 0.0
    common = len(user_keys & required_keys)
    if common == 0:
        return 0.0
    denom = math.sqrt(len(user_keys) * len(required_keys))
    if denom <= 0:
        return 0.0
    return common / denom


@router.get("/recommended-roles")
def recommended_roles(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    curated_roles = _load_curated_roles()
    trending_roles = [
        {k: v for k, v in role.items() if k in {"role", "uri", "category", "description"}}
        for role in curated_roles[:6]
    ]

    user_doc = db["user_skills"].find_one({"email": user.get("email")}) or {}
    user_skill_keys = _extract_user_skill_keys(user_doc.get("skills", []))

    if not user_skill_keys:
        return {
            "recommended_roles": [],
            "trending_roles": trending_roles,
            "all_roles": [
                {k: v for k, v in role.items() if k in {"role", "uri", "category", "description"}}
                for role in curated_roles
            ],
        }

    scored: list[dict[str, Any]] = []
    for role in curated_roles:
        required = set(role.get("skill_keys", []))
        sim = _cosine_set_similarity(user_skill_keys, required)
        scored.append(
            {
                "role": role["role"],
                "uri": role["uri"],
                "category": role["category"],
                "description": role["description"],
                "match_score": round(sim * 100.0, 2),
            }
        )

    scored.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "recommended_roles": scored[:3],
        "trending_roles": trending_roles,
        "all_roles": [
            {k: v for k, v in role.items() if k in {"role", "uri", "category", "description"}}
            for role in curated_roles
        ],
    }


@router.post("/gap")
def analysis_gap(payload: dict[str, Any]):
    """
    Accepts either:
      - { "occupation_uri": "...", "current_skills": [ ... ] }  OR
      - { "occupation": "...", "current_skills": [ ... ] }     OR
      - { "current_skills": [...], "target_occupation": "..." }

    If only occupation is provided, the service expects `current_skills` to be passed.
    """
    # normalize payload keys
    occupation = (
        payload.get("occupation_uri")
        or payload.get("occupation")
        or payload.get("target_occupation")
    )

    current_skills = payload.get("current_skills") or payload.get("currentSkills")

    if not occupation or not current_skills:
        raise HTTPException(status_code=400, detail="Missing occupation or current_skills")

    return compute_skill_gap(user_skills=current_skills, occupation=occupation)
