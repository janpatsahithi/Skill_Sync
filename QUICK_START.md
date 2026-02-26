# SkillSync - Quick Start Guide

## Overview

SkillSync is a user-centric intelligent support platform that integrates with an existing AI-based skill analysis engine. This guide will help you get the system up and running.

## Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (running on localhost:27017)
- Existing AI engine backend (Python FastAPI) running on port 8000

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
pip install -r app/requirements.txt
```

### 3. Ensure MongoDB is Running

```bash
# MongoDB should be running on localhost:27017
# Database name: skillsync
```

### 4. Start the Backend Server

```bash
# From backend directory
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

### 5. Verify Backend

Visit `http://localhost:8000` - you should see:
```json
{"status": "Backend running"}
```

API documentation available at: `http://localhost:8000/docs`

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend-new
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment (Optional)

Create `.env` file:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## First Steps

### 1. Register a New User

- Navigate to `http://localhost:5173/register`
- Create an account with name, email, and password

### 2. Set Up Profile

- After login, go to Profile page
- Fill in background, interests, career goals
- This enables personalized recommendations

### 3. Get Guidance

- Navigate to Guidance page
- Select goal type (career_change, skill_development, job_search)
- Select target occupation (if applicable)
- Click "Get Recommendations"

### 4. Create Goals

- Go to Planning page
- Create a new goal (short-term or long-term)
- Add tasks to track progress

### 5. Explore Community

- Visit Community page
- Create posts or comment on existing discussions
- Categories: career, learning, projects, guidance

### 6. Save Resources

- Go to Resources page
- Add learning resources (articles, videos, courses)
- Tag and organize them

## API Endpoints Overview

### Authentication
- `POST /users/register` - Register new user
- `POST /users/login` - Login and get JWT token

### User Context
- `GET /user-context` - Get user profile
- `POST /user-context` - Create/update profile

### Guidance
- `POST /guidance` - Get personalized recommendations

### Planning
- `GET /planning/goals` - List goals
- `POST /planning/goals` - Create goal
- `GET /planning/tasks` - List tasks
- `POST /planning/tasks` - Create task

### Community
- `GET /community/posts` - List posts
- `POST /community/posts` - Create post
- `POST /community/posts/{id}/comments` - Add comment

### Resources
- `GET /resources` - List resources
- `POST /resources` - Save resource

### Feedback
- `POST /feedback` - Submit feedback on recommendations

## Database Collections

The system uses MongoDB with the following collections:

- `users` - User accounts
- `user_skills` - Extracted skills (from existing AI engine)
- `user_context` - User profiles and preferences
- `goals` - User goals
- `tasks` - Tasks linked to goals
- `posts` - Community posts
- `comments` - Comments on posts
- `resources` - Saved learning resources
- `feedback` - User feedback

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running: `mongod`
   - Check connection string in `backend/app/db/database.py`

2. **Port Already in Use**
   - Change port in `uvicorn` command or kill existing process

3. **Import Errors**
   - Ensure all dependencies are installed
   - Check Python path and virtual environment

### Frontend Issues

1. **API Connection Error**
   - Verify backend is running on port 8000
   - Check `VITE_API_URL` in `.env` file
   - Check browser console for CORS errors

2. **Authentication Issues**
   - Clear localStorage and re-login
   - Check JWT token in browser DevTools

3. **Build Errors**
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Integration with Existing AI Engine

The system integrates with the existing AI skill analysis engine through:

1. **Direct Function Calls** (in `backend/app/api/guidance.py`):
   - `compute_skill_gap()` from `app.services.simple_skill_gap_service`
   - `JobRecommender.recommend()` from `app.models.job_recommender`
   - `generate_learning_path()` from `app.services.rag_reasoner`

2. **API Endpoints** (if needed):
   - The existing endpoints remain unchanged and can be called directly

## Development Notes

- Backend uses FastAPI with automatic API documentation
- Frontend uses React with Vite for fast development
- All new modules are added to existing backend structure
- AI engine remains unchanged (black-box integration)

## Next Steps

1. Review `SYSTEM_ARCHITECTURE.md` for detailed architecture
2. Check `API_DOCUMENTATION.md` for complete API reference
3. Explore the codebase to understand module structure
4. Customize according to your academic project requirements

## Support

For issues or questions:
1. Check the documentation files
2. Review error messages in console/logs
3. Verify all prerequisites are met
4. Ensure MongoDB and backend services are running
