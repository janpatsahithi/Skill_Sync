# SkillSync - System Architecture Documentation

## Executive Summary

SkillSync is a user-centric intelligent support platform designed as an academic final-year project. The system integrates with an existing AI-based skill analysis and recommendation engine (treated as a black-box service) and adds comprehensive user-focused modules around it.

## Core Constraint

**IMPORTANT**: The existing AI-based Skill Analysis and Recommendation Engine remains unchanged. This includes:
- Resume parsing
- Skill extraction
- Skill standardization
- Skill gap analysis
- Job and learning recommendations
- Explainable AI outputs

This engine is integrated **ONLY** via API calls or function interfaces. No refactoring, rewriting, or redesign of the core pipeline has been performed.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  - Dashboard, Profile, Guidance, Planning, Community,       │
│    Resources                                                │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST API
┌───────────────────────▼─────────────────────────────────────┐
│              Backend (Python FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  New User-Centric Modules                            │  │
│  │  - User Context & Profile                            │  │
│  │  - Intelligent Guidance                              │  │
│  │  - Planning & Progress Tracking                     │  │
│  │  - Community & Discussion                           │  │
│  │  - Resource Management                              │  │
│  │  - Feedback & Reflection                           │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │ Function Calls / API Integration        │
│  ┌───────────────▼──────────────────────────────────────┐  │
│  │  Existing AI Engine (Black-Box)                      │  │
│  │  - Skill Extraction                                  │  │
│  │  - Skill Gap Analysis                               │  │
│  │  - Job Recommendations                             │  │
│  │  - Learning Path Generation                         │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              MongoDB Database                               │
│  - users, user_skills, user_context                        │
│  - goals, tasks                                            │
│  - posts, comments                                          │
│  - resources                                                │
│  - feedback                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Framework**: Python FastAPI
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **AI Engine Integration**: Direct function calls to existing services

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Module Descriptions

### 1. User Context & Profile Module

**Purpose**: Foundation for personalization. Stores user background, interests, goals, preferences, and availability.

**Endpoints**:
- `POST /user-context` - Create/update user context
- `GET /user-context` - Get user context
- `PUT /user-context` - Update user context

**Database Collection**: `user_context`

**Schema**:
```json
{
  "user_id": "string",
  "email": "string",
  "background": "string",
  "interests": ["string"],
  "career_goals": "string",
  "preferences": {},
  "availability_hours_per_week": "number",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2. Intelligent Guidance & Decision Support Module

**Purpose**: Trigger the existing AI skill engine based on user goals and display recommendations with explainable reasoning.

**Endpoints**:
- `POST /guidance` - Get personalized guidance
- `GET /guidance/explain/{recommendation_id}` - Get explanation for recommendation

**Integration Points**:
- Calls `compute_skill_gap()` from existing AI engine
- Calls `JobRecommender.recommend()` from existing AI engine
- Calls `generate_learning_path()` from existing AI engine

**Database**: No direct storage (uses existing AI engine results)

### 3. Personal Planning & Progress Tracking Module

**Purpose**: Users can create goals, break them into tasks, and track progress.

**Endpoints**:
- Goals: `GET, POST, PUT, DELETE /planning/goals`
- Tasks: `GET, POST, PUT, DELETE /planning/tasks`

**Database Collections**: `goals`, `tasks`

**Relationships**:
- Tasks belong to Goals (one-to-many)
- Tasks can be linked to AI recommendations

### 4. Community & Collaborative Discussion Module

**Purpose**: Topic-based discussions for career, learning, projects, and guidance.

**Endpoints**:
- Posts: `GET, POST, PUT, DELETE /community/posts`
- Comments: `GET, POST, PUT, DELETE /community/posts/{post_id}/comments`
- Upvoting: `POST /community/posts/{post_id}/upvote`

**Database Collections**: `posts`, `comments`

**Features**:
- Category-based organization
- Tagging system
- Upvoting mechanism
- Nested comments support

### 5. Resource Discovery & Management Module

**Purpose**: Save, tag, and categorize learning resources. Support AI-recommended resources.

**Endpoints**:
- `GET, POST, PUT, DELETE /resources`
- `GET /resources/tags/list` - Get all tags

**Database Collection**: `resources`

**Features**:
- Resource types: article, video, course, book, tool
- Tagging and categorization
- Personal notes
- AI recommendation linking

### 6. Reflection & Feedback Module

**Purpose**: Collect feedback on recommendations for system improvement (human-in-the-loop).

**Endpoints**:
- `POST /feedback` - Submit feedback
- `GET /feedback` - Get feedback history
- `GET /feedback/stats` - Get aggregated statistics

**Database Collection**: `feedback`

**Data Collected**:
- Recommendation rating (1-5)
- Helpfulness indicator
- Feedback text
- Reflection notes

## Database Schema

### Collections Overview

1. **users** (existing)
   - User authentication and basic info

2. **user_skills** (existing)
   - Extracted skills from resumes

3. **user_context** (new)
   - User profile and preferences

4. **goals** (new)
   - User goals with progress tracking

5. **tasks** (new)
   - Tasks linked to goals

6. **posts** (new)
   - Community discussion posts

7. **comments** (new)
   - Comments on posts

8. **resources** (new)
   - Saved learning resources

9. **feedback** (new)
   - User feedback on recommendations

### Relationships

```
users (1) ──< (many) user_context
users (1) ──< (many) goals
goals (1) ──< (many) tasks
users (1) ──< (many) posts
posts (1) ──< (many) comments
users (1) ──< (many) resources
users (1) ──< (many) feedback
```

## API Integration Flow

### Example: Getting Personalized Guidance

```
1. User requests guidance via POST /guidance
   {
     "goal_type": "career_change",
     "target_occupation_uri": "..."
   }

2. Backend retrieves user skills from user_skills collection

3. Backend calls existing AI engine:
   - compute_skill_gap(user_skills, occupation_uri)
   - JobRecommender.recommend(user_skills)
   - generate_learning_path(occupation, missing_skills)

4. Backend formats results into RecommendationItem objects

5. Response includes:
   - Recommendations with reasoning
   - Skill gap analysis
   - Learning path
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── Layout.jsx          # Main layout with sidebar
│   └── ProtectedRoute.jsx  # Auth guard
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Profile.jsx
│   ├── Guidance.jsx
│   ├── Planning.jsx
│   ├── Community.jsx
│   └── Resources.jsx
├── context/
│   └── AuthContext.jsx     # Authentication state
├── services/
│   └── api.js             # API client
└── App.jsx                 # Main app with routing
```

### User Navigation Flow

```
Login/Register
    ↓
Dashboard (overview)
    ↓
Profile (setup context)
    ↓
Guidance (get recommendations)
    ↓
Planning (create goals/tasks)
    ↓
Community (discussions)
    ↓
Resources (save learning materials)
```

## Security

- JWT-based authentication
- Protected routes require valid token
- User data isolation (queries filtered by user email)
- CORS configured for development

## Evaluation Metrics (Academic)

### Functional Metrics
- User registration and authentication success rate
- Recommendation relevance (user feedback ratings)
- Goal completion rate
- Community engagement metrics

### Non-Functional Metrics
- API response times
- System availability
- Data consistency
- User satisfaction scores

## Deployment Considerations

### Backend
- FastAPI runs on port 8000 (default)
- MongoDB connection: `mongodb://localhost:27017/skillsync`
- Environment variables for configuration

### Frontend
- Vite dev server on port 5173
- Production build: `npm run build`
- Proxy configuration for API calls

## Future Extensions

1. Real-time notifications
2. Advanced analytics dashboard
3. Export functionality (PDF reports)
4. Mobile application
5. Integration with external job boards

## Academic Notes

- System demonstrates proper separation of concerns
- Modular architecture allows independent development
- AI engine integration respects black-box constraint
- Clear documentation for viva defense
- Academic tone maintained throughout



