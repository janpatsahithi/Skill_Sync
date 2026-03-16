import re
from urllib.parse import quote, quote_plus


def generate_job_links(role: str) -> dict:
    """
    Generate external job search links for a given role.
    """
    clean_role = (role or "").strip()
    query_encoded = quote(clean_role)
    plus_encoded = quote_plus(clean_role)
    naukri_slug = re.sub(r"[^a-z0-9]+", "-", clean_role.lower()).strip("-")

    return {
        "linkedin": f"https://www.linkedin.com/jobs/search/?keywords={query_encoded}",
        "indeed": f"https://www.indeed.com/jobs?q={plus_encoded}",
        "naukri": f"https://www.naukri.com/{naukri_slug}-jobs",
    }
