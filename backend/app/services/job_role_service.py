import csv
import json
from pathlib import Path
from app.schemas import OccupationResponse

BASE_DIR = Path(__file__).resolve().parents[1]
OCC_FILE = BASE_DIR / "datasets" / "occupations_en.csv"
FALLBACK_FILE = BASE_DIR / "datasets" / "fallback_roles.json"


def _fallback_occupations():
    occupations = []
    try:
        with open(FALLBACK_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return occupations

    for role in data.get("roles", []):
        label = (role.get("role") or "").strip()
        category = (role.get("category") or "").strip() or None
        if not label:
            continue
        occupations.append(
            OccupationResponse(
                label=label,
                uri=f"fallback://role/{label.lower().replace(' ', '-')}",
                source="fallback",
                category=category,
            )
        )
    return occupations


def get_valid_occupations():
    occupations = []
    seen = set()

    # Always add curated fallback roles first.
    for occ in _fallback_occupations():
        key = occ.label.lower().strip()
        if key in seen:
            continue
        seen.add(key)
        occupations.append(occ)

    # Then append ESCO roles if available.
    try:
        with open(OCC_FILE, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row["preferredLabel"].strip()
                uri = row["conceptUri"].strip()
                key = label.lower()
                if not label or key in seen:
                    continue
                seen.add(key)
                occupations.append(
                    OccupationResponse(
                        label=label,
                        uri=uri,
                        source="esco",
                        category=None,
                    )
                )
    except Exception:
        pass

    return occupations
