from typing import Any


def _safe_float(v: Any, default: float = 0.0) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def build_advisor_prompt_payload(
    query: str,
    user_profile: dict,
    extracted_skills: dict,
    top_job_matches: list[dict],
    skill_gap_analysis: dict,
    learning_resources: dict,
    rag_context: dict,
) -> dict:
    return {
        "system_identity": "You are SkillSync AI Advisor.",
        "mode": "question_focused_career_reasoning",
        "inputs": {
            "user_profile_data": user_profile,
            "extracted_user_skills": extracted_skills,
            "top_job_match_results_high_match_only": top_job_matches,
            "skill_gap_analysis": skill_gap_analysis,
            "learning_resource_data": learning_resources,
            "rag_context": rag_context,
            "user_query": query,
        },
        "strict_rules": [
            "You are NOT a general chatbot.",
            "Do NOT generate full career reports unless explicitly requested by the user.",
            "Do NOT give motivational or generic advice.",
            "Answer ONLY the user's specific career-related question using provided data.",
            "Explain what match score means in practical terms when relevant to the question.",
            "Explain why match is high/moderate/low when relevant.",
            "Identify the most important missing skills from provided data only.",
            "If comparing roles, explain which is stronger and why.",
            "If asked about readiness, classify as Ready, Moderately Ready, or Not Ready and justify.",
            "Never invent skills, roles, or trends not present in input.",
            'Do NOT say "Insufficient data to assess." unless no role data exists.',
            "Always end with a clear action recommendation.",
        ],
        "output_contract": {
            "format": "json",
            "required_keys": [
                "summary",
                "analysis",
                "recommended_strategy",
                "confidence_level",
            ],
            "style_requirements": [
                "Professional",
                "Analytical",
                "Evidence-based",
                "Concise",
                "No fluff",
                "No generic career advice",
                "Clear and practical",
            ],
        },
    }


def summarize_skill_gap(last_gap: dict) -> dict:
    missing_items = last_gap.get("missing_skills") or []
    critical = []
    enhancements = []
    optional = []

    for item in missing_items:
        if isinstance(item, dict):
            name = item.get("skill")
            importance = (item.get("importance") or "").lower()
            if not name:
                continue
            if importance == "essential":
                critical.append(name)
            elif importance == "optional":
                optional.append(name)
            else:
                enhancements.append(name)
        elif isinstance(item, str):
            enhancements.append(item)

    total_required = int(last_gap.get("total_required_skills") or 0)
    matched_count = int(last_gap.get("matched_count") or len(last_gap.get("covered_skills") or []))
    missing_count = int(last_gap.get("missing_count") or len(missing_items))

    return {
        "total_required_skills": total_required if total_required > 0 else (matched_count + missing_count),
        "matched_count": matched_count,
        "missing_count": missing_count,
        "critical_gap_skills": critical,
        "enhancement_skills": enhancements,
        "optional_skills": optional,
    }


def score_from_gap(last_gap: dict) -> tuple[float, float]:
    readiness = _safe_float(last_gap.get("readiness_score"), -1.0)
    if readiness >= 0:
        match_score = round(readiness * 100.0, 2)
        return match_score, round(max(0.0, 100.0 - match_score), 2)
    match_score = _safe_float(last_gap.get("match_score"), 0.0)
    gap_score = _safe_float(last_gap.get("gap_score"), max(0.0, 100.0 - match_score))
    return round(match_score, 2), round(gap_score, 2)
