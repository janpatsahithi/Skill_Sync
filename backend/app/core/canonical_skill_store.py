import json
from pathlib import Path

STORE = Path(__file__).resolve().parents[1] / "datasets" / "canonical_occupation_skills.json"

with open(STORE, encoding="utf-8") as f:
    CANONICAL_OCCUPATION_SKILLS = json.load(f)
