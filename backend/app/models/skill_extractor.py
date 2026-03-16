import re
from typing import Any

from app.core.modern_skill_registry import ModernSkillRegistry
from app.core.skill_registry import SkillRegistry


NOISE_WORDS = {
    "summary",
    "professional",
    "experienced",
    "motivated",
    "passionate",
    "seeking",
    "developed",
    "built",
    "analysis",
    "dashboard",
    "platform",
    "guidance",
    "college",
    "university",
    "bachelor",
    "cgpa",
    "india",
    "bengaluru",
    "udemy",
    "coursera",
    "foundations",
    "basics",
    "xyz",
}


class SkillExtractor:
    """
    Resume skill extractor with aggressive pre-match cleanup.

    Flow:
    1) Parse candidates from sections/blocks.
    2) Clean + normalize candidates before matching.
    3) Deduplicate by canonical key.
    4) Match against SkillRegistry.
    5) Keep ESCO matches and fallback skills.
    """

    _registry = SkillRegistry.get_instance()
    _modern_registry = ModernSkillRegistry.get_instance()
    _SECTION_PATTERNS = {
        "technical_skills": re.compile(
            r"^\s*(technical skills?|skills?|core skills?|technologies?|tech stack)\s*:?\s*$",
            re.IGNORECASE,
        ),
        "projects": re.compile(r"^\s*(projects?|project experience)\s*:?\s*$", re.IGNORECASE),
        "experience": re.compile(
            r"^\s*(experience|work experience|professional experience|employment)\s*:?\s*$",
            re.IGNORECASE,
        ),
        "education": re.compile(r"^\s*(education|academic|qualifications?)\s*:?\s*$", re.IGNORECASE),
        "certifications": re.compile(r"^\s*(certifications?|certificates?|licenses?)\s*:?\s*$", re.IGNORECASE),
    }
    _PROJECT_PHRASE_PATTERN = re.compile(
        r"\b(?:REST\s*API|GraphQL\s*API|Backend|Database|ML|AI)\b",
        re.IGNORECASE,
    )

    def __init__(self) -> None:
        self.registry = self._registry
        self.modern_registry = self._modern_registry
        self.section_weights = {
            "technical_skills": 1.0,
            "experience": 1.0,
            "projects": 0.9,
            "education": 0.8,
            "certifications": 0.85,
            "other": 0.7,
        }

    def extract_skills(self, resume_text: str) -> list[dict]:
        print(">>> NEW EXTRACTOR LOGIC RUNNING <<<")

        # Remove PDF artifacts/noise before any section parsing.
        sanitized_text = self._sanitize_resume_text(resume_text or "")
        sections = self._split_sections(sanitized_text)
        technical_block_candidates = self._extract_technical_block(sanitized_text)

        section_candidates: dict[str, set[str]] = {}
        for section_name, block in sections.items():
            candidates = self._extract_candidates(block, section_name)
            if section_name == "technical_skills":
                candidates.update(technical_block_candidates)
            section_candidates[section_name] = candidates

        # Clean + canonical dedup before matching.
        candidate_map: dict[str, dict[str, Any]] = {}
        total_raw_candidates = 0
        for section_name, candidates in section_candidates.items():
            for raw in candidates:
                total_raw_candidates += 1
                cleaned = self._clean_candidate(raw)
                if not cleaned:
                    continue
                dedup_key = self._canonical_key(cleaned)
                if not dedup_key:
                    continue
                if dedup_key not in candidate_map:
                    candidate_map[dedup_key] = {
                        "candidate": cleaned,
                        "section": section_name,
                    }

        print("Candidate count:", len(candidate_map))

        results_by_key: dict[str, dict[str, Any]] = {}
        esco_match_count = 0
        modern_match_count = 0

        unmatched_candidates: list[dict[str, str]] = []

        # Stage 1: strict ESCO matching.
        for dedup_key, payload in candidate_map.items():
            candidate = str(payload["candidate"])
            section_name = str(payload["section"])
            weight = self.section_weights.get(section_name, self.section_weights["other"])

            match = self.registry.match_skill(candidate)
            normalized_match = self._normalize_match(match)

            if normalized_match:
                esco_match_count += 1
                normalized_key = self._canonical_key(str(normalized_match["label"]))
                if not normalized_key:
                    normalized_key = dedup_key
                prev = results_by_key.get(normalized_key)
                item = {
                    "normalized_key": normalized_key,
                    "label": normalized_match["label"],
                    "category": "other",
                    "source": "esco",
                    "similarity": normalized_match["similarity"],
                    "section": section_name,
                    "weight": weight,
                    "uri": normalized_match["uri"],
                }
                if prev is None or float(item["similarity"]) > float(prev.get("similarity", 0.0)):
                    results_by_key[normalized_key] = item
            else:
                unmatched_candidates.append({"candidate": candidate, "section": section_name})

        # Stage 2: modern tech dataset matching for ESCO misses only.
        for payload in unmatched_candidates:
            candidate = payload["candidate"]
            section_name = payload["section"]
            weight = self.section_weights.get(section_name, self.section_weights["other"])

            modern_match = self.modern_registry.match_modern_skill(candidate)
            if not modern_match:
                continue

            normalized_key = str(modern_match["normalized_key"]).strip().lower()
            # ESCO-first: never override an ESCO hit with modern.
            if normalized_key in results_by_key and str(results_by_key[normalized_key].get("source")) == "esco":
                continue

            modern_match_count += 1
            prev = results_by_key.get(normalized_key)
            item = {
                "normalized_key": normalized_key,
                "label": modern_match["label"],
                "category": modern_match["category"],
                "source": "modern",
                "similarity": float(modern_match["similarity"]),
                "section": section_name,
                "weight": weight,
                "uri": None,
            }
            if prev is None or float(item["similarity"]) > float(prev.get("similarity", 0.0)):
                results_by_key[normalized_key] = item

        print("\n[SkillExtractor] Total raw candidates:", total_raw_candidates)
        print("[SkillExtractor] Total ESCO matches:", esco_match_count)
        print("[SkillExtractor] Total modern matches:", modern_match_count)

        results = list(results_by_key.values())
        return sorted(results, key=lambda x: float(x.get("similarity", 0.0)), reverse=True)

    # Backward-compatible wrapper for old callers.
    def extract(self, resume_text: str) -> list[dict]:
        extracted = self.extract_skills(resume_text)
        return [
            {
                "skill": str(item.get("label", "")),
                "uri": item.get("uri"),
                "confidence": float(item.get("similarity", 0.0)),
            }
            for item in extracted
        ]

    def _sanitize_resume_text(self, text: str) -> str:
        cleaned_lines: list[str] = []
        for line in text.splitlines():
            value = re.sub(r"\(cid:\d+\)", "", line)
            value = re.sub(r"\b\d+\)", "", value)
            value = value.replace("|", " ")
            value = re.sub(r"\s+", " ", value).strip()
            cleaned_lines.append(value)
        return "\n".join(cleaned_lines)

    def _split_sections(self, resume_text: str) -> dict[str, str]:
        lines = [line.strip() for line in resume_text.splitlines()]
        sections: dict[str, list[str]] = {
            "technical_skills": [],
            "projects": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "other": [],
        }

        current = "other"
        for line in lines:
            if not line:
                continue

            switched = False
            for name, pattern in self._SECTION_PATTERNS.items():
                if pattern.match(line):
                    current = name
                    switched = True
                    break
            if switched:
                continue

            sections[current].append(line)

        return {k: "\n".join(v) for k, v in sections.items() if v}

    def _extract_technical_block(self, text: str) -> list[str]:
        """
        Parse colon-based lines in a Technical Skills block.
        """
        skills: list[str] = []
        lines = text.split("\n")
        inside_tech = False

        for line in lines:
            line_clean = line.strip()
            lower = line_clean.lower()

            if not inside_tech and re.search(r"\btechnical skills?\b", lower):
                inside_tech = True
                continue

            if inside_tech:
                if not line_clean:
                    break
                if any(
                    pattern.match(line_clean)
                    for key, pattern in self._SECTION_PATTERNS.items()
                    if key != "technical_skills"
                ):
                    break

                if ":" in line_clean:
                    _, right = line_clean.split(":", 1)
                    for part in right.split(","):
                        token = part.strip()
                        if token:
                            skills.append(token)

        return skills

    def _extract_candidates(self, section_text: str, section_name: str) -> set[str]:
        candidates: set[str] = set()
        if not section_text:
            return candidates

        lines = [line.strip() for line in section_text.splitlines() if line.strip()]
        merged_text = " ".join(lines)

        if section_name == "technical_skills":
            for line in lines:
                if ":" in line:
                    _, rhs = line.split(":", 1)
                    for token in rhs.split(","):
                        token = token.strip()
                        if token:
                            candidates.add(token)

        for line in lines:
            if "," in line:
                for token in line.split(","):
                    token = token.strip()
                    if token:
                        candidates.add(token)

        for line in lines:
            if "/" in line:
                candidates.add(line)
                for token in line.split("/"):
                    token = token.strip()
                    if token:
                        candidates.add(token)

        for line in lines:
            if re.match(r"^\s*[-*\u2022]\s*", line):
                bullet = re.sub(r"^\s*[-*\u2022]\s*", "", line).strip()
                if not bullet:
                    continue
                candidates.add(bullet)
                for token in bullet.split(","):
                    token = token.strip()
                    if token:
                        candidates.add(token)
                for token in re.findall(r"\b(?:[A-Z]{2,}|[A-Z][A-Za-z0-9+#.\-]{1,})\b", bullet):
                    candidates.add(token)

        for token in re.findall(r"\b(?:[A-Z]{2,}|[A-Z][A-Za-z0-9+#.\-]{1,})\b", merged_text):
            candidates.add(token)

        if section_name == "projects":
            candidates |= self._extract_project_candidates(merged_text)

        return candidates

    def _extract_project_candidates(self, text: str) -> set[str]:
        candidates: set[str] = set()

        for token in re.findall(r"\b[a-zA-Z][a-zA-Z0-9]*\.js\b", text):
            candidates.add(token)

        for token in re.findall(r"\b(?:[A-Z]{2,}|[A-Z][A-Za-z0-9+#.\-]{1,})\b", text):
            candidates.add(token)

        for token in self._PROJECT_PHRASE_PATTERN.findall(text):
            candidates.add(token)

        for phrase in re.findall(r"\bREST\s+API\b", text, flags=re.IGNORECASE):
            candidates.add(phrase)

        return candidates

    def _clean_candidate(self, text: str) -> str | None:
        """
        Clean and normalize a candidate skill label before matching.
        """
        label = text or ""

        # 1) Remove PDF artifacts/noise.
        label = re.sub(r"\(cid:\d+\)", "", label)
        label = re.sub(r"\b\d+\)", "", label)
        label = label.replace("|", " ")

        # 2) Drop URL/link candidates early.
        lower_raw = label.lower()
        if "http" in lower_raw or "github.com" in lower_raw or "linkedin.com" in lower_raw:
            return None

        # 3) Remove section-style prefixes, keep text after last colon.
        if ":" in label:
            label = label.split(":")[-1]

        # 4) Normalize and variant-canonicalize.
        label = label.strip().lower()
        label = re.sub(r"\.js\b", "", label)
        label = label.replace("nodejs", "node")
        label = label.replace("reactjs", "react")
        label = label.replace("rest apis", "rest api")
        label = label.replace("tailwind css", "tailwind")

        # Keep alnum/+/#/space only for stable matching.
        label = re.sub(r"[^a-z0-9\s\+#]", " ", label)
        label = re.sub(r"\s+", " ", label).strip()

        # 5) Drop long sentence fragments.
        if len(label.split()) > 4:
            return None

        # 6) Drop obvious noise labels.
        if len(label) < 3:
            return None
        if label.isdigit():
            return None
        if label in NOISE_WORDS:
            return None

        return label

    def _canonical_key(self, label: str) -> str:
        normalized = re.sub(r"[^a-z0-9\s]", "", label.lower())
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized

    def _normalize_match(self, match: Any) -> dict | None:
        if not match:
            return None

        if isinstance(match, dict):
            uri = match.get("uri")
            label = match.get("label")
            similarity = match.get("similarity", match.get("score"))
            try:
                similarity_value = float(similarity)
            except (TypeError, ValueError):
                similarity_value = 0.0

            if uri and label:
                return {
                    "uri": str(uri),
                    "label": str(label),
                    "similarity": similarity_value,
                }
            return None

        if isinstance(match, (tuple, list)) and len(match) >= 3:
            uri, label, similarity = match[0], match[1], match[2]
            try:
                similarity_value = float(similarity)
            except (TypeError, ValueError):
                similarity_value = 0.0
            if uri and label:
                return {
                    "uri": str(uri),
                    "label": str(label),
                    "similarity": similarity_value,
                }
        return None
