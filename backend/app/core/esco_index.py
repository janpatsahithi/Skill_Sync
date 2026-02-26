import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[1]
RELATION_FILE = BASE_DIR / "datasets" / "occupationSkillRelations_en.csv"

OCCUPATION_SKILL_MAP = defaultdict(set)

with open(RELATION_FILE, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        occ = row["occupationUri"].strip()
        skill = row["skillUri"].strip()
        OCCUPATION_SKILL_MAP[occ].add(skill)

print(f"[ESCO] Loaded {len(OCCUPATION_SKILL_MAP)} occupations")
