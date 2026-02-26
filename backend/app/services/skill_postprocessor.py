from typing import List, Dict

# Language & low-value skills to remove
LANGUAGE_SKILLS = {
    "english", "hindi", "kannada", "tamil", "telugu",
    "french", "german", "spanish"
}

GENERIC_SKILLS = {
    "computer science",
    "computer technology",
    "education administration",
    "industrial engineering",
    "dock operations"
}


def clean_and_deduplicate(skills: List[Dict]) -> List[Dict]:
    """
    Final skill post-processing:
    - remove language skills
    - remove generic academic / low-value skills
    - deduplicate by CANONICAL skill name
    - keep highest confidence
    - clamp confidence to [0, 1]
    """

    deduped: Dict[str, Dict] = {}

    for skill in skills:
        name = skill["skill"].lower().strip()
        uri = skill.get("uri")
        confidence = float(skill.get("confidence", 0))

        # ---- FILTER UNWANTED SKILLS ----
        if name in LANGUAGE_SKILLS:
            continue

        if name in GENERIC_SKILLS:
            continue

        # ---- CLAMP CONFIDENCE ----
        confidence = max(0.0, min(confidence, 1.0))

        # ---- DEDUPLICATE BY CANONICAL NAME ----
        if name not in deduped or confidence > deduped[name]["confidence"]:
            deduped[name] = {
                "skill": name,
                "uri": uri,  # keep best representative URI
                "confidence": round(confidence, 3)
            }

    # ---- SORT BY CONFIDENCE ----
    return sorted(
        deduped.values(),
        key=lambda x: x["confidence"],
        reverse=True
    )
