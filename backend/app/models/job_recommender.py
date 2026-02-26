import csv
from pathlib import Path
from collections import defaultdict


class JobRecommender:
    def __init__(self):
        base_dir = Path(__file__).resolve().parents[1]
        self.relations_file = base_dir / "datasets" / "occupationSkillRelations_en.csv"

        if not self.relations_file.exists():
            raise FileNotFoundError(f"Missing file: {self.relations_file}")

        # Validate columns
        with open(self.relations_file, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required_columns = {
                "occupationUri",
                "relationType",
                "skillType",
                "skillUri"
            }

            missing = required_columns - set(reader.fieldnames)
            if missing:
                raise ValueError(
                    f"Relations dataset missing columns: {missing}. "
                    f"Found columns: {reader.fieldnames}"
                )

        # ✅ Build occupation → essential skills map
        self.occupation_skill_map = self._build_skill_map()

    # --------------------------------------------------

    def _build_skill_map(self):
        """
        Build mapping:
        occupation_uri -> set(skill_uris)
        """
        mapping = defaultdict(set)

        with open(self.relations_file, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["relationType"] == "essential":
                    mapping[row["occupationUri"]].add(row["skillUri"])

        return dict(mapping)

    # --------------------------------------------------

    def recommend(self, user_skill_uris):
        """
        Recommend occupations based on user skills.

        Args:
            user_skill_uris (set[str]): Skill URIs from resume

        Returns:
            list[dict]: Ranked job recommendations
        """
        if not user_skill_uris:
            return []

        user_skill_uris = set(user_skill_uris)
        results = []

        for occ_uri, required_skills in self.occupation_skill_map.items():
            if not required_skills:
                continue

            matched = user_skill_uris & required_skills
            score = len(matched) / len(required_skills)

            if score > 0:
                results.append({
                    "occupation_uri": occ_uri,
                    "match_percent": round(score * 100, 2),
                    "matched_skills": list(matched),
                    "missing_skills": list(required_skills - matched)
                })

        return sorted(results, key=lambda x: x["match_percent"], reverse=True)
