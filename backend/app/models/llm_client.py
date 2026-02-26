import os
import json
import re
from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise RuntimeError("❌ GOOGLE_API_KEY not found in environment")

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "models/gemini-flash-latest"


def _clean_json(text: str) -> str:
    """
    Removes ```json ... ``` or ``` ... ``` wrappers if present
    """
    text = text.strip()

    # Remove triple backtick blocks
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*", "", text)
        text = re.sub(r"```$", "", text)

    return text.strip()


def gemini_generate_json(prompt: str):
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    raw = response.text
    cleaned = _clean_json(raw)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON returned by Gemini",
            "raw": raw,
        }
