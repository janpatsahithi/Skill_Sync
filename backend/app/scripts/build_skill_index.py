import csv
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"
BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = BASE_DIR / "datasets" / "skills_en.csv"
OUTPUT_DIR = BASE_DIR / "core" / "skill_index"


def normalize_text(text: str) -> str:
    """
    Basic normalization for lexical matching.
    - lowercase
    - strip whitespace
    - collapse multiple spaces
    - basic punctuation cleanup
    """
    value = (text or "").strip().lower()


    
    # Keep word chars, spaces, plus and hash for skills like c++ / c#
    value = re.sub(r"[^\w\s\+#\.]", " ", value)
    value = value.replace("_", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _parse_alt_labels(raw: str) -> list[str]:
    if not raw:
        return []
    # ESCO alt labels are usually pipe-separated.
    parts = [p.strip() for p in raw.split("|")]
    return [p for p in parts if p]


def load_esco(csv_path: Path) -> list[dict[str, Any]]:
    """
    Load raw ESCO skill rows with preferred + alt labels.
    """
    rows: list[dict[str, Any]] = []

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            label = (row.get("preferredLabel") or "").strip()
            uri = (row.get("conceptUri") or row.get("skillUri") or "").strip()
            alt_labels = _parse_alt_labels(row.get("altLabels") or "")

            if not label or not uri:
                continue

            rows.append(
                {
                    "uri": uri,
                    "label": label,
                    "alt_labels": alt_labels,
                }
            )

    return rows


def build_index(raw_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int], dict[str, int]]:
    """
    Build unified skill list and lexical lookup.

    Returns:
    - skills: list of skill entries (deterministic order)
    - lookup: normalized label/alt label -> index
    - stats: counters
    """
    merged_by_norm: dict[str, dict[str, Any]] = {}
    duplicate_label_collisions = 0

    # Deterministic processing by (normalized preferred label, uri)
    sortable_rows = sorted(
        raw_rows,
        key=lambda r: (normalize_text(r["label"]), r["uri"]),
    )

    for row in sortable_rows:
        norm_label = normalize_text(row["label"])
        if not norm_label:
            continue

        normalized_alts = sorted(
            {
                normalize_text(alt)
                for alt in row.get("alt_labels", [])
                if normalize_text(alt)
            }
        )

        entry = merged_by_norm.get(norm_label)
        if entry is None:
            merged_by_norm[norm_label] = {
                "uri": row["uri"],
                "label": row["label"].strip(),
                "normalized_label": norm_label,
                "alt_labels": normalized_alts,
            }
        else:
            duplicate_label_collisions += 1
            # Deterministic URI winner: lexicographically smaller URI
            if row["uri"] < entry["uri"]:
                entry["uri"] = row["uri"]
                entry["label"] = row["label"].strip()
            entry["alt_labels"] = sorted(set(entry["alt_labels"]) | set(normalized_alts))

    skills = sorted(
        merged_by_norm.values(),
        key=lambda s: (s["normalized_label"], s["uri"]),
    )

    lookup: dict[str, int] = {}
    lookup_collisions = 0

    for idx, skill in enumerate(skills):
        key = skill["normalized_label"]
        lookup[key] = idx

        for alt in skill["alt_labels"]:
            if alt == key:
                continue
            if alt in lookup and lookup[alt] != idx:
                lookup_collisions += 1
                continue
            lookup[alt] = idx

    stats = {
        "duplicate_label_collisions": duplicate_label_collisions,
        "lookup_collisions": lookup_collisions,
    }
    return skills, lookup, stats


def generate_embeddings(skills: list[dict[str, Any]], model_name: str = MODEL_NAME) -> np.ndarray:
    labels = [s["normalized_label"] for s in skills]
    model = SentenceTransformer(model_name)
    embeddings = model.encode(
        labels,
        convert_to_numpy=True,
        show_progress_bar=True,
        batch_size=256,
        normalize_embeddings=True,
    )
    return embeddings.astype(np.float32, copy=False)


def save_index(skills: list[dict[str, Any]], embeddings: np.ndarray, lookup: dict[str, int], output_dir: Path, model_name: str) -> tuple[Path, Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)

    index_path = output_dir / "skill_index.json"
    embeddings_path = output_dir / "skill_embeddings.npy"
    lookup_path = output_dir / "skill_lookup.json"

    index_payload = {
        "metadata": {
            "model": model_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "total_skills": len(skills),
            "embedding_dim": int(embeddings.shape[1]) if embeddings.ndim == 2 and embeddings.size else 0,
        },
        "skills": skills,
    }

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_payload, f, ensure_ascii=False, indent=2)

    np.save(embeddings_path, embeddings)

    with open(lookup_path, "w", encoding="utf-8") as f:
        json.dump(lookup, f, ensure_ascii=False, indent=2, sort_keys=True)

    return index_path, embeddings_path, lookup_path


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    logging.info("Loading ESCO skills from: %s", DATASET_PATH)
    raw_rows = load_esco(DATASET_PATH)
    logging.info("Total ESCO skills loaded: %d", len(raw_rows))

    skills, lookup, stats = build_index(raw_rows)
    logging.info("Total unique normalized skills: %d", len(skills))
    logging.info("Duplicate normalized-label collisions resolved: %d", stats["duplicate_label_collisions"])
    logging.info("Lookup key collisions skipped: %d", stats["lookup_collisions"])

    embeddings = generate_embeddings(skills, model_name=MODEL_NAME)
    embedding_dim = int(embeddings.shape[1]) if embeddings.ndim == 2 and embeddings.size else 0
    logging.info("Embedding dimension: %d", embedding_dim)

    index_path, embeddings_path, lookup_path = save_index(
        skills=skills,
        embeddings=embeddings,
        lookup=lookup,
        output_dir=OUTPUT_DIR,
        model_name=MODEL_NAME,
    )

    logging.info("Saved skill index metadata: %s", index_path)
    logging.info("Saved skill embeddings: %s", embeddings_path)
    logging.info("Saved skill lookup: %s", lookup_path)


if __name__ == "__main__":
    main()
