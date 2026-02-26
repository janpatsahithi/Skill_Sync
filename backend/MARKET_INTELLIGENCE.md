# Market Intelligence Integration (Level 2)

This module upgrades SkillSync from static-only ESCO matching to market-aware analysis.

## What is added

- Live market trend fetch from Adzuna API
- Skill frequency extraction from job titles/descriptions
- Top in-demand skill ranking with demand %
- Market-aware weighting added to skill-gap output
- MongoDB cache collection: `market_skill_trends`

## Environment variables

Set these before starting backend:

```env
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
ADZUNA_COUNTRY=us
MARKET_API_TIMEOUT_SECONDS=8
```

If credentials are missing, API still works with graceful fallback (`data_source: "unavailable"`).

## New/updated files

- `app/services/market_job_service.py`
- `app/api/jobs.py`
- `app/services/skill_gap_service.py`
- `app/services/simple_skill_gap_service.py`
- `app/db/database.py`

## New endpoints

### `GET /jobs/market-trends`

Query params:

- `role` (required)
- `location` (optional, default: `United States`)
- `top_k` (optional, default: `10`)
- `refresh` (optional, default: `false`)

Response includes:

- `top_skills[]` with `skill`, `frequency`, `demand_pct`
- `total_jobs_analyzed`
- `data_source`

### `GET /jobs/trending-roles`

Query params:

- `location` (optional, default: `United States`)

Response includes role activity list with `job_postings_found`.

## Gap analysis enhancement

Both services now include market fields:

- `top_market_skills`
- `market_context`
- `market_readiness_score`
- `missing_skills[]` enriched with:
  - `market_demand_pct`
  - `market_frequency`
  - `priority_score`

This keeps existing response shape compatible while adding market intelligence.
