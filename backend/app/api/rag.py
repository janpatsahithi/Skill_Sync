# app/api/rag.py

import json
from typing import Any
from fastapi import APIRouter, Depends
from app.core.deps import optional_auth
from app.db.database import user_context_collection, user_skills_collection
from app.models.job_recommender import JobRecommender
from app.models.rag_retriever import RAGRetriever
from app.models.llm_client import gemini_generate_json
from app.services.job_recommendation_presenter import role_meta, skill_name, display_match_score

router = APIRouter(prefix="/rag", tags=["RAG"])

retriever = RAGRetriever()
job_recommender = JobRecommender()


def _normalize_missing_skills(raw_missing: Any) -> list[str]:
    if not isinstance(raw_missing, list):
        return []

    skills: list[str] = []
    for item in raw_missing:
        if isinstance(item, str):
            skills.append(item)
        elif isinstance(item, dict) and item.get("skill"):
            skills.append(str(item["skill"]))
    return skills


def detect_intent(message: str) -> str:
    text = (message or "").strip().lower()
    if not text:
        return "general"

    greeting_words = {"hi", "hello", "hey", "good morning", "good afternoon", "good evening"}
    if text in greeting_words or any(text.startswith(x) for x in ["hi ", "hello ", "hey "]):
        return "greeting"

    if any(k in text for k in ["am i ready", "ready for", "readiness", "how ready"]):
        return "readiness"
    if any(k in text for k in ["why is my match low", "skill gap", "missing skill", "missing skills", "gap"]):
        return "skill_gap"
    if any(k in text for k in ["what should i learn", "what to learn", "learn next", "course", "certification", "upskill"]):
        return "learning"
    if any(k in text for k in ["compare", "which role", "better role", "vs ", "versus"]):
        return "comparison"
    if any(k in text for k in ["career direction", "career path", "which career", "what role suits me", "suitable roles", "which domain"]):
        return "career_direction"
    return "general"


def _score_from_gap(last_gap: dict) -> tuple[float, float]:
    readiness = last_gap.get("readiness_score")
    if isinstance(readiness, (int, float)):
        match_score = round(float(readiness) * 100.0, 2)
        return match_score, round(max(0.0, 100.0 - match_score), 2)
    match_score = float(last_gap.get("match_score", 0.0) or 0.0)
    gap_score = float(last_gap.get("gap_score", max(0.0, 100.0 - match_score)) or max(0.0, 100.0 - match_score))
    return round(match_score, 2), round(gap_score, 2)


def _build_skill_gap(last_gap: dict) -> dict:
    missing_items = last_gap.get("missing_skills") or []
    critical: list[str] = []
    enhancements: list[str] = []
    optional: list[str] = []
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

    matched_count = len(last_gap.get("covered_skills") or [])
    missing_count = len(missing_items)
    total_required = int(last_gap.get("total_required_skills") or (matched_count + missing_count))
    return {
        "total_required_skills": total_required,
        "matched_count": matched_count,
        "missing_count": missing_count,
        "critical_gap_skills": critical,
        "enhancement_skills": enhancements,
        "optional_skills": optional,
    }


def _build_user_context(current_user: dict | None) -> dict:
    if not current_user:
        return {
            "user_question_context": {},
            "normalized_skills": [],
            "job_matches": [],
            "skill_gap_data": {},
        }

    email = current_user.get("email")
    context_doc = user_context_collection.find_one({"email": email}) or {}
    last_gap = context_doc.get("last_skill_gap") or {}
    match_score, gap_score = _score_from_gap(last_gap)

    skills_doc = user_skills_collection.find_one({"email": email}) or {}
    skill_uris = [s.get("uri") for s in skills_doc.get("skills", []) if isinstance(s, dict) and s.get("uri")]

    top_job_matches: list[dict] = []
    if skill_uris:
        ranked = job_recommender.recommend(skill_uris)
        for item in ranked:
            role_info = role_meta(item.get("occupation_uri"))
            role = role_info["role"]
            matched_skills = [skill_name(s) for s in item.get("matched_skills", [])]
            missing = [skill_name(s) for s in item.get("missing_skills", [])]
            score = display_match_score(matched_skills, missing)

            if score >= 60:
                critical_missing = missing[:3]
                top_job_matches.append(
                    {
                        "role_name": role,
                        "match_percentage": score,
                        "matched_skills": matched_skills,
                        "missing_skills": missing,
                        "critical_missing_skills": critical_missing,
                        "occupation_description": role_info["description"],
                    }
                )
        top_job_matches = top_job_matches[:6]

    normalized_skills = [s.get("skill") for s in skills_doc.get("skills", []) if isinstance(s, dict) and s.get("skill")]
    skill_gap = _build_skill_gap(last_gap)

    return {
        "user_question_context": {
            "match_score": round(match_score, 2),
            "gap_score": round(gap_score, 2),
            "target_role": last_gap.get("occupation") or context_doc.get("career_goals") or "Not specified",
        },
        "normalized_skills": normalized_skills,
        "job_matches": top_job_matches,
        "skill_gap_data": skill_gap,
    }


def _normalize_llm_response(raw: Any) -> str:
    if not isinstance(raw, dict):
        return str(raw)
    if isinstance(raw.get("answer"), str):
        return raw["answer"]
    if isinstance(raw.get("response"), str):
        return raw["response"]
    if isinstance(raw.get("summary"), str):
        return raw["summary"]
    if raw.get("error") and raw.get("raw"):
        return str(raw.get("raw"))
    return json.dumps(raw, ensure_ascii=False)


def _ensure_action_recommendation(answer: str, context: dict) -> str:
    text = (answer or "").strip()
    lower = text.lower()
    if "next action" in lower or "action recommendation" in lower:
        return text

    gaps = (context.get("skill_gap_data") or {}).get("critical_gap_skills") or []
    if gaps:
        return f"{text}\n\nNext action: Focus this week on {gaps[0]} and update one portfolio artifact showing that skill."
    return f"{text}\n\nNext action: Apply to one high-match role and tailor your resume to the matched skills listed."


def _sanitize_advisor_output(answer: str) -> str:
    """
    Keep output plain-text and conversational.
    Strips markdown emphasis markers and trims excessive whitespace.
    """
    text = str(answer or "").replace("**", "")
    lines = [line.strip() for line in text.splitlines()]
    compact = "\n".join(line for line in lines if line)
    return compact.strip()


def _extract_readiness_role(query: str) -> str:
    text = (query or "").strip()
    lower = text.lower()
    markers = ["ready for", "am i ready for", "ready to become", "ready to work as"]
    for m in markers:
        idx = lower.find(m)
        if idx >= 0:
            role = text[idx + len(m):].strip(" ?.,!")
            return role
    return ""


def _find_role_match(role_query: str, job_matches: list[dict]) -> dict | None:
    if not role_query:
        return None
    rq = role_query.lower().strip()
    for job in job_matches:
        name = str(job.get("role_name", "")).lower()
        if rq == name or rq in name or name in rq:
            return job
    return None


def _has_context_data(context: dict) -> bool:
    uq = context.get("user_question_context") or {}
    if float(uq.get("match_score", 0) or 0) > 0:
        return True
    if float(uq.get("gap_score", 0) or 0) > 0:
        return True
    if uq.get("target_role") and uq.get("target_role") != "Not specified":
        return True
    if context.get("skill_gap_data"):
        return True
    return False


@router.post("/ask")
def ask_rag(query: str, current_user: dict | None = Depends(optional_auth)):
    intent = detect_intent(query)

    if intent == "greeting":
        return {
            "answer": "Hi. Ask me a specific career question like readiness, skill gaps, learning priorities, or role comparison.",
            "intent": intent,
        }

    docs = retriever.retrieve(query)
    advisor_context = _build_user_context(current_user)
    normalized_skills = advisor_context.get("normalized_skills", [])
    job_matches = advisor_context.get("job_matches", [])
    if not normalized_skills and not _has_context_data(advisor_context):
        return {
            "answer": "Insufficient data to assess. Upload or refresh your skills and run job matching first.\n\nNext action: Re-run skill extraction, then ask your question again.",
            "intent": intent,
        }

    if intent == "readiness":
        role_query = _extract_readiness_role(query)
        if role_query and not _find_role_match(role_query, job_matches):
            return {
                "answer": f"I could not find '{role_query}' in your current matched roles.\n\nNext action: Run job matching for that role and then ask readiness again.",
                "intent": intent,
            }

    if intent == "career_direction" and not normalized_skills:
        return {
            "answer": "I can suggest career direction once your skill profile is available.\n\nNext action: Upload your resume or complete your profile to extract skills.",
            "intent": intent,
        }

    detailed_requested = any(k in (query or "").lower() for k in ["full analysis", "detailed analysis", "full report"])
    if intent == "learning":
        length_rule = "Keep the answer under 200 words."
    else:
        length_rule = "Keep the answer under 250 words." if not detailed_requested else "Provide a detailed answer."

    intent_guidance = {
        "readiness": "If asked about readiness, use matched role data to classify readiness and explain practical implications plus critical missing skills.",
        "skill_gap": "Explain why match is low/moderate/high using critical and enhancement gaps from provided data.",
        "learning": "Prioritize top 2-3 most impactful missing skills from best-matched role and keep concise.",
        "comparison": "Compare roles using match_percentage and explain which is stronger and why.",
        "career_direction": "Suggest 2-3 suitable role paths based on strongest normalized skills; recommend running job matching for readiness.",
        "general": "Answer the user's specific question directly using provided data.",
    }

    prompt_payload = {
        "system_role": (
            "You are a supportive career mentor. Speak naturally and conversationally. "
            "Do not use markdown formatting. "
            "Keep responses concise and practical. "
            "Avoid robotic phrasing. "
            "Sound like a real person giving guidance."
        ),
        "intent": intent,
        "rules": [
            "Answer only the user's specific question.",
            "Use only provided data (question, normalized skills, job matches, skill gap, RAG context).",
            "Use simple, direct, human language.",
            "Give a short alignment statement first when relevant.",
            "Briefly explain why the fit is high, moderate, or low using the provided data.",
            "Avoid heavy formatting, bullets, or headings unless absolutely necessary.",
            "Do not use markdown markers like **.",
            "Avoid robotic phrases such as: 'Based on your current skill set', 'It is evident that', 'Furthermore', 'In conclusion'.",
            "Do not say 'insufficient data' unless both skills and context are empty.",
            "Keep response length between 150 and 250 words unless the user asks for a shorter answer.",
            "End with a clear 'Next action:' recommendation.",
            length_rule,
        ],
        "intent_instruction": intent_guidance.get(intent, intent_guidance["general"]),
        "user_question": query,
        "normalized_skills": normalized_skills,
        "job_matches": job_matches,
        "skill_gap_data": advisor_context.get("skill_gap_data", {}),
        "rag_context": docs,
        "output_format": {"answer": "string"},
    }

    llm_output = gemini_generate_json(json.dumps(prompt_payload, ensure_ascii=False))
    answer_text = _normalize_llm_response(llm_output)
    answer_text = _ensure_action_recommendation(answer_text, advisor_context)
    answer_text = _sanitize_advisor_output(answer_text)

    return {
        "answer": answer_text,
        "intent": intent,
    }
