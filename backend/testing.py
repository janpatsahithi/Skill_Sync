import csv

seen = set()
with open("app/datasets/occupationSkillRelations_en.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        seen.add(row["occupationUri"])

print(list(seen)[:5])
