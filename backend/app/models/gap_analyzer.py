def analyze_gap(user_skills, required_skills):
    user_set = set(s["skill"] for s in user_skills)
    req_set = set(required_skills)

    missing = req_set - user_set
    extra = user_set - req_set

    return {
        "missing_skills": list(missing),
        "extra_skills": list(extra)
    }
