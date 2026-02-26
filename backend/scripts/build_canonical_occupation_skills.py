import csv
import json
from pathlib import Path
from collections import defaultdict

from app.models.skill_matcher import match_to_canonical

BASE = Path(__file__).resolve().parents[1]

RELATIONS = BASE / "app/datasets/occupationSkillRelations_en.csv"
SKILLS = BASE / "app/datasets/skills_en.csv"
OUTPUT = BASE / "app/datasets/canonical_occupation_skills.json"


def load_skill_uri_to_label():
    """Build skillUri -> preferredLabel map"""
    mapping = {}

    with open(SKILLS, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = row.get("skillUri") or row.get("conceptUri")
            if not key:
                continue
            mapping[key] = row.get("preferredLabel", "").strip()

    return mapping


def build():
    skill_lookup = load_skill_uri_to_label()
    store = defaultdict(lambda: {"essential": set(), "optional": set()})

    with open(RELATIONS, encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            skill_uri = row["skillUri"]
            occupation_uri = row["occupationUri"]
            relation = row["relationType"].lower()

            if skill_uri not in skill_lookup:
                continue

            skill_label = skill_lookup[skill_uri]

            canonical = match_to_canonical(skill_label)
            if not canonical:
                continue

            if "essential" in relation:
                store[occupation_uri]["essential"].add(canonical)
            else:
                store[occupation_uri]["optional"].add(canonical)

    output = {
        k: {
            "essential": sorted(v["essential"]),
            "optional": sorted(v["optional"])
        }
        for k, v in store.items()
    }

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print("✅ Canonical occupation skills built successfully")


if __name__ == "__main__":
    build()
