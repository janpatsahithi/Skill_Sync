import re
import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text()
    return text


def split_by_sections(text: str):
    sections = {
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "other": []
    }

    current = "other"
    for line in text.splitlines():
        l = line.lower().strip()

        if "skill" in l:
            current = "skills"
        elif "experience" in l:
            current = "experience"
        elif "project" in l:
            current = "projects"
        elif "education" in l:
            current = "education"

        if line.strip():
            sections[current].append(line.strip())

    return sections
