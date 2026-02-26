import csv
from collections import defaultdict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
SKILLS_CSV = BASE_DIR / "datasets" / "skills_en.csv"
RELATIONS_PATH = BASE_DIR / "datasets" / "occupationSkillRelations_en.csv"


def load_skill_uri_to_label():
    """Load skillUri -> preferredLabel mapping from skills_en.csv"""
    mapping = {}
    with open(SKILLS_CSV, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = row.get("skillUri") or row.get("conceptUri")
            if not key:
                continue
            mapping[key] = row.get("preferredLabel", "").lower()
    return mapping


def load_occupation_skill_index():
    """
    Returns:
    {
      occupation_uri: {
         "essential": set(skill_labels),
         "optional": set(skill_labels)
      }
    }
    
    JOINS occupationSkillRelations_en.csv with skills_en.csv
    because relations file only contains skillUri, not labels
    """
    skill_lookup = load_skill_uri_to_label()
    index = defaultdict(lambda: {"essential": set(), "optional": set()})

    with open(RELATIONS_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            occ = row["occupationUri"]
            skill_uri = row["skillUri"]
            rel = row["relationType"].lower()

            # Look up the skill label from the URI
            if skill_uri not in skill_lookup:
                continue

            skill_label = skill_lookup[skill_uri]

            if "essential" in rel:
                index[occ]["essential"].add(skill_label)
            else:
                index[occ]["optional"].add(skill_label)

    return index
