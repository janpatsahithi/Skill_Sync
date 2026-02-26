from pathlib import Path
import csv

SKILLS_CSV = Path(__file__).resolve().parents[1] / "datasets" / "skills_en.csv"

class EscoSkillNormalizer:
    def __init__(self):
        self.lookup = {}

    def load(self):
        with open(SKILLS_CSV, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                preferred = row["preferredLabel"].lower()
                self.lookup[preferred] = preferred

                if row.get("altLabels"):
                    for alt in row["altLabels"].split("|"):
                        self.lookup[alt.lower()] = preferred

        print("ESCO skills loaded:", len(self.lookup))

    def normalize(self, skill: str) -> str:
        return self.lookup.get(skill.lower(), skill.lower())
