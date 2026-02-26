import csv
import json
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = BASE_DIR / "datasets"
INDEX_DIR = BASE_DIR / "core" / "skill_index"

SKILLS_CSV = DATASET_DIR / "skills_en.csv"


def build_skill_index():
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    skills = []
    labels = []

    with open(SKILLS_CSV, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            label = row.get("preferredLabel")
            uri = row.get("conceptUri")

            if not label or not uri:
                continue

            label = label.lower().strip()

            # skip very generic junk
            if len(label) < 3:
                continue

            skills.append({
                "label": label,
                "uri": uri
            })
            labels.append(label)

    print(f"Loaded {len(skills)} ESCO skills")

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(labels, convert_to_numpy=True)

    with open(INDEX_DIR / "skills_index.json", "w", encoding="utf-8") as f:
        json.dump(skills, f, indent=2)

    np.save(INDEX_DIR / "skills_embeddings.npy", embeddings)

    print("✅ Skill index built successfully")


if __name__ == "__main__":
    build_skill_index()
