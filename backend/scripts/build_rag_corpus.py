import json
import csv
from pathlib import Path

# backend/
BASE = Path(__file__).resolve().parents[1]

DATASETS = BASE / "app" / "datasets"

skills_csv = DATASETS / "skills_en.csv"
canon_json = DATASETS / "canonical_occupation_skills.json"
OUT = DATASETS / "esco_rag_docs.json"

docs = []

# ---------- SKILLS ----------
with open(skills_csv, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        label = row.get("preferredLabel")
        if not label:
            continue

        docs.append({
            "type": "skill",
            "id": label.lower(),
            "text": f"Skill: {label}. This is a professional skill used in jobs and careers."
        })

# ---------- OCCUPATIONS ----------
with open(canon_json, encoding="utf-8") as f:
    data = json.load(f)

for uri, skills in data.items():
    text = (
        f"Occupation {uri} requires essential skills: "
        f"{', '.join(skills.get('essential', []))}. "
        f"Optional skills include: {', '.join(skills.get('optional', []))}."
    )

    docs.append({
        "type": "occupation",
        "id": uri,
        "text": text
    })

# ---------- WRITE OUTPUT ----------
OUT.write_text(json.dumps(docs, indent=2), encoding="utf-8")
print("✅ RAG corpus created:", OUT)
