# Skill Gap Service - Empty Sets Bug Analysis

## The Problem
When calling the `/skills/gap` endpoint in Swagger UI, you get empty `matched_skills` and `missing_skill_uris` for all values.

## Root Cause Analysis

The skill gap service works by:
1. **Extracting skills** from user resume → returns URIs like `http://data.europa.eu/esco/skill/fed5b267-...`
2. **Looking up required skills** for occupation → reads from `occupationSkillRelations_en.csv` 
3. **Matching** user skill URIs with required skill URIs using set intersection

**The issue is likely that:**
- The extracted skill URIs are NOT matching the URIs in the occupation relations CSV
- This causes both sets to be compared but no intersection found

## How to Debug

I've added a new **debug endpoint** at:
```
POST /skills/debug/gap
```

**Steps to debug in Swagger UI:**

1. First, **extract skills** from a resume:
   - Call `POST /skills/extract` with a resume text
   - This stores skills in the database

2. Then **list available occupations**:
   - Call `GET /skills/occupations`
   - Pick one occupation and copy its `occupation_uri`

3. **Call the debug endpoint**:
   - Call `POST /skills/debug/gap` with that `occupation_uri`
   - This will return:
     - Sample user skills extracted (with their URIs)
     - Sample required skills for that occupation
     - Count of matched and missing skills

4. **Compare the URI formats**:
   - Look at the user skill URIs
   - Look at the required skill URIs
   - Check if they're in the same format

## What to Look For

### Example Output:
```json
{
  "occupation_uri": "http://data.europa.eu/esco/occupation/00030d09-2b3a-4efd-87cc-c4ea39d27c34",
  "user_skills_count": 12,
  "user_skills_sample": [
    {
      "skill": "python programming",
      "uri": "http://data.europa.eu/esco/skill/abc123...",
      "confidence": 0.95
    }
  ],
  "user_skill_uris": [
    "http://data.europa.eu/esco/skill/abc123...",
    "http://data.europa.eu/esco/skill/def456..."
  ],
  "required_skills_count": 45,
  "required_skills_sample": [
    "http://data.europa.eu/esco/skill/fed5b267...",
    "http://data.europa.eu/esco/skill/05bc7677..."
  ],
  "matched_count": 0,
  "missing_count": 45
}
```

**If `matched_count` is 0, then the URIs don't match.**

## Possible Causes

1. **URI Format Mismatch**: User URIs might be shortened or formatted differently
2. **Skill Extractor Bug**: Not returning proper ESCO URIs
3. **Database Storage Issue**: URIs being modified when saved to MongoDB
4. **CSV Parsing Issue**: Whitespace or encoding issues in the CSV

## Enhanced Logging

I've also added detailed logging to the skill gap service. Check your backend console output when calling the endpoint - you'll see:

```
[SKILL GAP] User skill URIs extracted: 12
[SKILL GAP] Sample user URIs: ['http://...', 'http://...']
[SKILL GAP] Required skills for http://...: 45
[SKILL GAP] Sample required URIs: ['http://...', 'http://...']
[SKILL GAP] Matched skills: 0
[SKILL GAP] Missing skills: 45
[SKILL GAP] Match percentage: 0%
```

## Next Steps

1. Run the debug endpoint with a test occupation
2. Compare the URI formats
3. If they don't match, we need to fix the skill extraction/storage pipeline
4. Check the console logs to see exact URI values being compared

