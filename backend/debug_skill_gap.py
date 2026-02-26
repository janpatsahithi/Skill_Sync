from app.services.skill_gap_service import compute_skill_gap

skills = [
    "python computer programming",
    "utilise machine learning",
    "perform data analysis",
    "sql server"
]

# use any occupationUri key from the JSON
occupation_uri = list(
    __import__("json").load(
        open("app/datasets/canonical_occupation_skills.json")
    ).keys()
)[0]

print(compute_skill_gap(skills, occupation_uri))
