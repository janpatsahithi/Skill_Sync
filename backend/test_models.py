import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise RuntimeError("❌ GOOGLE_API_KEY not found")

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "models/gemini-flash-latest"

def gemini_generate_json(prompt: str):
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    text = response.text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "error": "Model did not return valid JSON",
            "raw": text
        }
