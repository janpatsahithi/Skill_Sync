import csv
import re
from functools import lru_cache
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
OCC_FILE = BASE_DIR / "datasets" / "occupations_en.csv"
SKILL_FILE = BASE_DIR / "datasets" / "skills_en.csv"


def _clean_text(value: str) -> str:
    return " ".join((value or "").split()).strip()


@lru_cache(maxsize=1)
def _occupation_meta() -> dict[str, dict]:
    mapping: dict[str, dict] = {}
    with open(OCC_FILE, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uri = (row.get("conceptUri") or "").strip()
            if not uri:
                continue
            mapping[uri] = {
                "label": _clean_text(row.get("preferredLabel") or ""),
                "description": _clean_text(row.get("description") or row.get("definition") or ""),
            }
    return mapping


@lru_cache(maxsize=1)
def _skill_labels() -> dict[str, str]:
    mapping: dict[str, str] = {}
    with open(SKILL_FILE, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uri = (row.get("conceptUri") or row.get("skillUri") or "").strip()
            label = _clean_text(row.get("preferredLabel") or "")
            if uri and label:
                mapping[uri] = label
    return mapping


def _fallback_label_from_uri(uri: str) -> str:
    tail = (uri or "").rstrip("/").split("/")[-1]
    if not tail:
        return "Unknown Skill"
    text = re.sub(r"[-_]+", " ", tail).strip()
    return text.title() if text else "Unknown Skill"


def skill_name(value: str) -> str:
    if not value:
        return "Unknown Skill"
    if value.startswith("http://") or value.startswith("https://"):
        return _skill_labels().get(value, _fallback_label_from_uri(value))
    return _clean_text(value)


def role_meta(role_uri: str) -> dict:
    meta = _occupation_meta().get(role_uri, {})
    role = meta.get("label") or role_uri
    desc = meta.get("description") or "Recommended role based on your current skill profile."
    return {"role": role, "description": desc}


def display_match_score(matched_skills: list[str], missing_skills: list[str]) -> int:
    matched_weight = float(len(matched_skills))
    total_weight = float(len(matched_skills) + len(missing_skills))
    if total_weight <= 0:
        return 0

    score = int(round((matched_weight / total_weight) * 100))
    if matched_weight > 0 and score < 20:
        return 20
    if matched_weight > 0 and score < 5:
        return 5
    return max(0, min(100, score))
