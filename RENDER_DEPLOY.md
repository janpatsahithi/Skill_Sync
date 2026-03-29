# Render Deployment

This repository is set up for a two-service Render deployment:

- `skillweave-backend`: FastAPI web service from `backend/`
- `skillweave-frontend`: static site from `frontend-new/`

## Before pushing to GitHub

- Keep `backend/.env` local only.
- Use `backend/.env.example` as the safe template.
- Rotate any secrets that were previously committed.

## Deploy on Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select this repository.
3. Render will detect `render.yaml` and propose both services.
4. Provide values for:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `GOOGLE_API_KEY`
   - `CORS_ORIGINS`
   - `VITE_API_URL`

## Recommended values

- `CORS_ORIGINS`: your frontend URL, for example `https://skillweave-frontend.onrender.com`
- `VITE_API_URL`: your backend URL, for example `https://skillweave-backend.onrender.com`

## Deploy order

1. Create the Blueprint.
2. Let the backend deploy first.
3. Copy the backend public URL into the frontend `VITE_API_URL`.
4. Copy the frontend public URL into the backend `CORS_ORIGINS`.
5. Redeploy both services once those URLs are set.
