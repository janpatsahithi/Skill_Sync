import csv
from pathlib import Path

import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from app.utils.text_utils import split_by_sections
from app.models.skill_normalizer import normalize_skills


MIN_CONFIDENCE = 0.6
MAX_CONFIDENCE = 0.95

SECTION_WEIGHTS = {
    "skills": 1.0,
    "experience": 0.9,
    "projects": 0.85,
    "education": 0.6
}


class SkillExtractor:
    _nlp = None
    _embedder = None

    def __init__(self):
        base_dir = Path(__file__).resolve().parents[1]
        self.skills_path = base_dir / "datasets" / "skills_en.csv"

        if not self.skills_path.exists():
            raise FileNotFoundError(f"Missing dataset: {self.skills_path}")

        self.skills = self._load_skills()

        # Precompute ESCO embeddings ONCE
        self.skill_embeddings = self._get_embedder().encode(
            [s["label"] for s in self.skills],
            convert_to_numpy=True
        )

    # ---------- LOADERS ----------

    @classmethod
    def _get_nlp(cls):
        if cls._nlp is None:
            cls._nlp = spacy.load("en_core_web_lg")
        return cls._nlp

    @classmethod
    def _get_embedder(cls):
        if cls._embedder is None:
            cls._embedder = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._embedder

    # ---------- DATA ----------

    def _load_skills(self):
        skills = []

        with open(self.skills_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row.get("preferredLabel")
                uri = row.get("skillUri") or row.get("conceptUri")

                if not label or not uri:
                    continue

                skills.append({
                    "label": label.lower().strip(),
                    "uri": uri
                })

        return skills

    # ---------- PUBLIC API ----------

    def extract(self, resume_text: str):
        sections = split_by_sections(resume_text)
        results = {}

        for section, lines in sections.items():
            if not lines:
                continue

            weight = SECTION_WEIGHTS.get(section, 0.7)
            text = " ".join(lines)

            matches = self._semantic_match(text, weight)

            for skill in matches:
                uri = skill["uri"]
                if uri not in results or skill["confidence"] > results[uri]["confidence"]:
                    results[uri] = skill

        final_skills = sorted(
            results.values(),
            key=lambda x: x["confidence"],
            reverse=True
        )

        return final_skills

    # ---------- CORE LOGIC ----------

    def _semantic_match(self, text: str, section_weight: float):
        nlp = self._get_nlp()
        embedder = self._get_embedder()

        doc = nlp(text)

        # --------------------------------
        # 1. Extract candidate phrases
        # --------------------------------
        phrases = set()

        for chunk in doc.noun_chunks:
            phrase = chunk.text.strip().lower()
            if 1 < len(phrase.split()) <= 5:
                phrases.add(phrase)

        for ent in doc.ents:
            if ent.label_ in {"ORG", "PRODUCT", "WORK_OF_ART"}:
                phrases.add(ent.text.strip().lower())

        if not phrases:
            return []

        phrases = list(phrases)

        # --------------------------------
        # 2. Embed phrases
        # --------------------------------
        phrase_embeddings = embedder.encode(
            phrases,
            convert_to_numpy=True
        )

        matched = []

        # --------------------------------
        # 3. Match phrases → ESCO skills
        # --------------------------------
        for phrase, phrase_emb in zip(phrases, phrase_embeddings):
            sims = cosine_similarity(
                phrase_emb.reshape(1, -1),
                self.skill_embeddings
            )[0]

            top_indices = sims.argsort()[-3:][::-1]

            for idx in top_indices:
                similarity = float(sims[idx])

                if similarity < MIN_CONFIDENCE:
                    continue

                esco_skill = self.skills[idx]

                # 🔑 FIX: normalize SINGLE skill correctly
                normalized = normalize_skills([esco_skill["label"]])
                if not normalized:
                    continue

                skill_name = normalized[0]  # <-- always a STRING now

                confidence = min(
                    similarity * section_weight,
                    MAX_CONFIDENCE
                )

                # Penalize generic / language skills
                if skill_name.lower() in {"english", "hindi", "kannada"}:
                    confidence *= 0.6
                elif len(skill_name.split()) <= 2:
                    confidence *= 0.85

                confidence = round(float(confidence), 3)

                if confidence < 0.55:
                    continue

                matched.append({
                    "skill": skill_name,
                    "uri": esco_skill["uri"],
                    "confidence": confidence
                })

        return matched
