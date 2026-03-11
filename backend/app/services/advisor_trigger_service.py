from typing import Any


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def detect_advisor_trigger(user_context: dict) -> dict:
    """
    Detect one highest-priority proactive advisor trigger.

    Priority:
    LOW_READINESS > STAGNATION > STRONG_ALTERNATIVE > HIGH_READINESS
    """
    if not isinstance(user_context, dict):
        return {}

    match_score = _to_float(user_context.get("match_score"), 0.0)
    progress_delta = _to_float(user_context.get("progress_delta"), 0.0)
    alternatives = user_context.get("alternative_roles") or []

    # 1) LOW_READINESS
    if match_score < 60:
        return {
            "trigger_type": "LOW_READINESS",
            "reason": "Match score below readiness threshold",
            "recommended_action": "Suggest realistic transition strategy",
        }

    # 2) STAGNATION
    if progress_delta <= 0:
        return {
            "trigger_type": "STAGNATION",
            "reason": "No measurable improvement detected in the recent period",
            "recommended_action": "Suggest focused skill progression plan",
        }

    # 3) STRONG_ALTERNATIVE
    best_alt = None
    for alt in alternatives:
        if not isinstance(alt, dict):
            continue
        alt_score = _to_float(alt.get("match_score"), -1.0)
        if best_alt is None or alt_score > best_alt["match_score"]:
            best_alt = {
                "role": alt.get("role", "Alternative Role"),
                "match_score": alt_score,
            }

    if best_alt and best_alt["match_score"] >= (match_score + 15):
        return {
            "trigger_type": "STRONG_ALTERNATIVE",
            "reason": f"Alternative role '{best_alt['role']}' has significantly higher match score",
            "recommended_action": "Compare target role against a stronger adjacent role path",
        }

    # 4) HIGH_READINESS
    if match_score >= 85:
        return {
            "trigger_type": "HIGH_READINESS",
            "reason": "Match score indicates strong readiness for target role",
            "recommended_action": "Encourage immediate applications and interview preparation",
        }

    return {}
