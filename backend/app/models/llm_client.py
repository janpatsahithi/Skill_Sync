import json
import logging
import re

from app.core.config import settings

logger = logging.getLogger(__name__)

GOOGLE_MODEL = "models/gemini-flash-latest"
_google_client = None
_google_client_mode = None


def _get_google_client():
    global _google_client, _google_client_mode
    if not settings.GOOGLE_API_KEY:
        return None
    if _google_client is None:
        try:
            from google import genai as google_genai

            _google_client = google_genai.Client(api_key=settings.GOOGLE_API_KEY)
            _google_client_mode = "genai"
        except Exception:
            try:
                import google.generativeai as google_generativeai

                google_generativeai.configure(api_key=settings.GOOGLE_API_KEY)
                _google_client = google_generativeai.GenerativeModel("gemini-1.5-flash")
                _google_client_mode = "generativeai"
            except Exception:
                _google_client = None
                _google_client_mode = None
    return _google_client


def _clean_json(text: str) -> str:
    """Remove fenced-code wrappers if present."""
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*", "", text)
        text = re.sub(r"```$", "", text)
    return text.strip()


def _generate_text(prompt: str) -> str:
    client = _get_google_client()
    if client is None:
        return ""
    if _google_client_mode == "genai":
        response = client.models.generate_content(model=GOOGLE_MODEL, contents=prompt)
        return (response.text or "").strip()
    if _google_client_mode == "generativeai":
        response = client.generate_content(prompt)
        return (getattr(response, "text", "") or "").strip()
    return ""


def gemini_generate_json(prompt: str):
    raw = _generate_text(prompt)
    if not raw:
        return {
            "error": "LLM API key not configured. Set GOOGLE_API_KEY.",
            "raw": "",
        }

    cleaned = _clean_json(raw)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON returned by LLM",
            "raw": raw,
        }


def generate(prompt: str) -> str:
    """Backward-compatible text generation helper used by legacy RAG service."""
    raw = _generate_text(prompt)
    if not raw:
        logger.warning("LLM API key is missing; returning fallback response.")
        return "LLM service is not configured. Please set GOOGLE_API_KEY."
    return raw
