import csv
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR.parent / "datasets" / "skills_en.csv"
INDEX_DIR = BASE_DIR / "skill_index"

INDEX_DIR.mkdir(exist_ok=True)

MODEL_NAME = "all-MiniLM-L6-v2"


def build_index():
    skills = []

    with open(DATASET_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            label = row.get("preferredLabel")
            uri = row.get("conceptUri")

            if not label or not uri:
                continue

            skills.append({
                "label": label.lower().strip(),
                "uri": uri
            })

    print(f"Loaded {len(skills)} skills")

    embedder = SentenceTransformer(MODEL_NAME)
    embeddings = embedder.encode(
        [s["label"] for s in skills],
        convert_to_numpy=True,
        show_progress_bar=True
    )

    with open(INDEX_DIR / "skills_index.json", "w", encoding="utf-8") as f:
        json.dump(skills, f, indent=2)

    np.save(INDEX_DIR / "skills_embeddings.npy", embeddings)

    print("✅ Skill index built successfully")


if __name__ == "__main__":
    build_index()
