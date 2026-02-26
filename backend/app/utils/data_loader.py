import pandas as pd
from app.core.config import DATASET_DIR
import logging

logger = logging.getLogger(__name__)


def load_skills():
    """Load skills from the skills dataset."""
    try:
        skills_path = DATASET_DIR / "skills_en.csv"
        if not skills_path.exists():
            raise FileNotFoundError(f"Skills dataset not found: {skills_path}")
        
        df = pd.read_csv(skills_path)
        if "preferredLabel" not in df.columns:
            raise ValueError("Skills dataset missing 'preferredLabel' column")
        
        return df["preferredLabel"].str.lower().tolist()
    except Exception as e:
        logger.error(f"Error loading skills: {e}")
        raise


def load_job_skill_map():
    """Load job-to-skills mapping from datasets."""
    try:
        occ_path = DATASET_DIR / "occupations_en.csv"
        rel_path = DATASET_DIR / "occupationSkillRelations_en.csv"
        skills_path = DATASET_DIR / "skills_en.csv"
        
        # Verify all files exist
        for path in [occ_path, rel_path, skills_path]:
            if not path.exists():
                raise FileNotFoundError(f"Dataset not found: {path}")
        
        occ = pd.read_csv(occ_path)
        rel = pd.read_csv(rel_path)
        skills = pd.read_csv(skills_path)
        
        # Validate required columns
        required_cols = {
            'occupations_en.csv': ['conceptUri', 'preferredLabel'],
            'occupationSkillRelations_en.csv': ['occupationUri', 'skillUri'],
            'skills_en.csv': ['conceptUri', 'preferredLabel']
        }
        
        for df_name, cols in [('occ', required_cols['occupations_en.csv']),
                              ('rel', required_cols['occupationSkillRelations_en.csv']),
                              ('skills', required_cols['skills_en.csv'])]:
            df = locals()[df_name]
            for col in cols:
                if col not in df.columns:
                    raise ValueError(f"{df_name} dataset missing '{col}' column")

        # Map skill URI → skill name
        skill_map = dict(zip(skills["conceptUri"], skills["preferredLabel"]))

        job_skills = {}
        for _, row in rel.iterrows():
            job_uri = row["occupationUri"]
            skill_uri = row["skillUri"]
            skill_name = skill_map.get(skill_uri)
            if skill_name:
                job_skills.setdefault(job_uri, []).append(skill_name)

        # Map occupation URI → job name
        job_names = dict(zip(occ["conceptUri"], occ["preferredLabel"]))

        # Final: Job Name → Skill List
        result = {
            job_names[job]: skills
            for job, skills in job_skills.items()
            if job in job_names
        }
        
        logger.info(f"Loaded job skill map: {len(result)} jobs, {len(skill_map)} skills")
        return result
    except Exception as e:
        logger.error(f"Error loading job skill map: {e}")
        raise
