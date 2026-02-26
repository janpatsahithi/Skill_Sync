import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
SKILL_INDEX_FILE = BASE_DIR / "core" / "skill_index" / "skills_index.json"

ESCO_SKILL_PREFIX = "http://data.europa.eu/esco/skill/"

# 🔹 GLOBAL DICTIONARY
SKILL_URI_TO_NAME: dict[str, str] = {}

# 🔹 Load once at startup
with open(SKILL_INDEX_FILE, encoding="utf-8") as f:
    data = json.load(f)

    for item in data:
        uri = item.get("uri")
        name = item.get("name")

        if uri and name:
            SKILL_URI_TO_NAME[uri.strip()] = name.strip()


def normalize_skill_uri(skill: str) -> str:
    """
    Ensures skill is a FULL ESCO URI
    """
    if skill.startswith("http"):
        return skill.strip()

    return ESCO_SKILL_PREFIX + skill.strip()


def uri_to_name(skill: str) -> str:
    """
    Converts skill URI or UUID → readable name
    """
    uri = normalize_skill_uri(skill)
    return SKILL_URI_TO_NAME.get(uri, uri.split("/")[-1])
