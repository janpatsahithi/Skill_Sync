# app/services/rag_reasoner.py
from urllib.parse import urlparse

from app.models.rag_retriever import retrieve_docs
from app.models.llm_client import gemini_generate_json


def _is_direct_resource_url(url: str) -> bool:
    if not url:
        return False
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return False

    host = parsed.netloc.lower()
    path = parsed.path.lower()
    query = (parsed.query or "").lower()

    # Reject generic search pages; keep direct resource pages only.
    if "youtube.com" in host and path == "/results":
        return False
    if "google." in host and path.startswith("/search"):
        return False
    if "geeksforgeeks.org" in host and query.startswith("s="):
        return False

    return True


def _normalize_resources(resources) -> list[dict]:
    normalized = []

    for res in resources or []:
        if not isinstance(res, dict):
            continue

        title = (res.get("title") or res.get("name") or "Learning resource").strip()
        platform = (res.get("platform") or "Web").strip()
        url = (res.get("url") or "").strip()

        if not _is_direct_resource_url(url):
            continue

        normalized.append(
            {
                "title": title,
                "platform": platform,
                "url": url,
            }
        )

    return normalized


def _ensure_resource_links(learning_path: dict) -> dict:
    levels = learning_path.get("levels")
    if not isinstance(levels, list):
        return learning_path

    for level in levels:
        skills = level.get("skills")
        if not isinstance(skills, list):
            continue
        for skill in skills:
            skill["resources"] = _normalize_resources(skill.get("resources") or skill.get("courses"))

    return learning_path


def generate_learning_path(occupation: str, missing_skills: list[str]) -> dict:
    """Generate a structured learning path using RAG + Gemini."""
    # Retrieve context for the occupation and skills
    docs = []
    for skill in missing_skills:
        docs.extend(retrieve_docs(f"{occupation} {skill}", k=3))

    context_text = "\n".join(docs) if docs else "(No reference material found)"

    prompt = f"""
You are a career learning path expert.

OCCUPATION: {occupation}

MISSING SKILLS TO LEARN:
{', '.join(missing_skills)}

REFERENCE MATERIAL:
{context_text}

Create a JSON learning path with this structure:
{{
  "total_weeks": number,
  "levels": [
    {{
      "level": "Beginner|Intermediate|Advanced",
      "weeks": number,
      "skills": [
        {{
          "name": "skill name",
          "why": "why this skill matters (1-2 sentences)",
          "resources": [
            {{"title": "resource title", "platform": "platform name", "url": "https://direct-resource-link"}}
          ]
        }}
      ]
    }}
  ]
}}

REQUIREMENTS:
- Create 2-3 levels (Beginner, Intermediate, Advanced)
- Include 2-3 skills per level
- Suggest 1-2 resources per skill
- Every resource MUST include a direct, specific URL (no search URLs)
- Prefer practical resources from YouTube and GeeksforGeeks when relevant
- Do not return links like youtube.com/results, google search URLs, or geeksforgeeks.org/?s=...
- Total duration: 8-16 weeks

Return ONLY valid JSON.
"""

    raw = gemini_generate_json(prompt)
    if not isinstance(raw, dict):
        return {
            "total_weeks": 8,
            "levels": [],
        }
    return _ensure_resource_links(raw)
