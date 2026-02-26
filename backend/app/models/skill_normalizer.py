from app.models.skill_matcher import match_to_canonical

def normalize_skills(extracted_skills: list[str]) -> list[str]:
    canonical = set()

    for skill in extracted_skills:
        matched = match_to_canonical(skill)
        if matched:
            canonical.add(matched)

    return list(canonical)
