# SkillSync API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are obtained via `/users/login` endpoint.

---

## User Context & Profile API

### Create/Update User Context
```http
POST /user-context
```

**Request Body:**
```json
{
  "background": "Computer Science graduate with 2 years experience",
  "interests": ["web development", "machine learning"],
  "career_goals": "Become a senior full-stack developer",
  "preferences": {},
  "availability_hours_per_week": 10
}
```

**Response:**
```json
{
  "user_id": "string",
  "email": "user@example.com",
  "background": "string",
  "interests": ["string"],
  "career_goals": "string",
  "preferences": {},
  "availability_hours_per_week": 10,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### Get User Context
```http
GET /user-context
```

### Update User Context
```http
PUT /user-context
```

**Request Body:** (all fields optional)
```json
{
  "background": "Updated background",
  "interests": ["new interest"],
  "career_goals": "Updated goals"
}
```

---

## Intelligent Guidance API

### Get Guidance
```http
POST /guidance
```

**Request Body:**
```json
{
  "goal_type": "career_change",
  "target_occupation_uri": "http://data.europa.eu/esco/occupation/...",
  "focus_areas": []
}
```

**Response:**
```json
{
  "user_id": "string",
  "recommendations": [
    {
      "type": "job",
      "title": "Software Developer",
      "description": "Match score: 85%",
      "relevance_score": 0.85,
      "reasoning": "Based on your skills: Python, JavaScript, React",
      "action_items": [
        "Review job requirements",
        "Update resume",
        "Apply for position"
      ]
    }
  ],
  "skill_gap_analysis": {
    "readiness_score": 0.75,
    "covered_skills": ["Python", "JavaScript"],
    "missing_essential": ["Docker", "Kubernetes"],
    "missing_optional": ["AWS", "CI/CD"]
  },
  "learning_path": {
    "summary": "Learning path for target occupation",
    "steps": ["Step 1", "Step 2"]
  },
  "generated_at": "2024-01-01T00:00:00"
}
```

### Explain Recommendation
```http
GET /guidance/explain/{recommendation_id}
```

---

## Planning & Progress API

### Goals

#### Get Goals
```http
GET /planning/goals?goal_type=short_term&status=active
```

**Response:**
```json
[
  {
    "id": "string",
    "user_id": "string",
    "title": "Learn React",
    "description": "Master React framework",
    "goal_type": "short_term",
    "status": "active",
    "target_date": "2024-06-01T00:00:00",
    "progress_percentage": 60.0,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

#### Create Goal
```http
POST /planning/goals
```

**Request Body:**
```json
{
  "title": "Learn React",
  "description": "Master React framework",
  "goal_type": "short_term",
  "target_date": "2024-06-01T00:00:00",
  "linked_occupation_uri": "optional"
}
```

#### Update Goal
```http
PUT /planning/goals/{goal_id}
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated title",
  "status": "completed",
  "target_date": "2024-07-01T00:00:00"
}
```

#### Delete Goal
```http
DELETE /planning/goals/{goal_id}
```

### Tasks

#### Get Tasks
```http
GET /planning/tasks?goal_id={goal_id}&status=pending
```

#### Create Task
```http
POST /planning/tasks
```

**Request Body:**
```json
{
  "goal_id": "string",
  "title": "Complete React tutorial",
  "description": "Finish official React tutorial",
  "due_date": "2024-02-01T00:00:00",
  "is_ai_suggested": false,
  "linked_recommendation_id": "optional"
}
```

#### Update Task
```http
PUT /planning/tasks/{task_id}
```

**Request Body:**
```json
{
  "status": "completed",
  "title": "Updated title"
}
```

#### Delete Task
```http
DELETE /planning/tasks/{task_id}
```

---

## Community API

### Posts

#### Get Posts
```http
GET /community/posts?category=career&tag=python&limit=20&skip=0
```

**Response:**
```json
[
  {
    "id": "string",
    "user_id": "string",
    "author_name": "John Doe",
    "title": "Career advice needed",
    "content": "Looking for advice on...",
    "category": "career",
    "tags": ["python", "career"],
    "upvotes": 5,
    "comment_count": 3,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

#### Create Post
```http
POST /community/posts
```

**Request Body:**
```json
{
  "title": "Career advice needed",
  "content": "Looking for advice on...",
  "category": "career",
  "tags": ["python", "career"]
}
```

#### Update Post
```http
PUT /community/posts/{post_id}
```

#### Delete Post
```http
DELETE /community/posts/{post_id}
```

#### Upvote Post
```http
POST /community/posts/{post_id}/upvote
```

### Comments

#### Get Comments
```http
GET /community/posts/{post_id}/comments
```

#### Create Comment
```http
POST /community/posts/{post_id}/comments
```

**Request Body:**
```json
{
  "content": "This is a helpful comment",
  "parent_comment_id": "optional"
}
```

#### Update Comment
```http
PUT /community/comments/{comment_id}
```

#### Delete Comment
```http
DELETE /community/comments/{comment_id}
```

#### Upvote Comment
```http
POST /community/comments/{comment_id}/upvote
```

---

## Resources API

### Get Resources
```http
GET /resources?resource_type=article&tag=python&status=saved
```

**Response:**
```json
[
  {
    "id": "string",
    "user_id": "string",
    "title": "React Documentation",
    "url": "https://react.dev",
    "description": "Official React documentation",
    "resource_type": "article",
    "tags": ["react", "javascript"],
    "notes": "Very comprehensive",
    "status": "saved",
    "is_ai_recommended": true,
    "linked_recommendation_id": "string",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

### Create Resource
```http
POST /resources
```

**Request Body:**
```json
{
  "title": "React Documentation",
  "url": "https://react.dev",
  "description": "Official React documentation",
  "resource_type": "article",
  "tags": ["react", "javascript"],
  "notes": "Very comprehensive",
  "is_ai_recommended": false,
  "linked_recommendation_id": "optional"
}
```

### Update Resource
```http
PUT /resources/{resource_id}
```

### Delete Resource
```http
DELETE /resources/{resource_id}
```

### Get Tags
```http
GET /resources/tags/list
```

**Response:**
```json
{
  "tags": ["react", "python", "javascript"]
}
```

---

## Feedback API

### Create Feedback
```http
POST /feedback
```

**Request Body:**
```json
{
  "recommendation_id": "string",
  "recommendation_type": "job",
  "rating": 4,
  "feedback_text": "Very helpful recommendation",
  "was_helpful": true,
  "reflection_notes": "This helped me understand my skill gaps"
}
```

### Get Feedback
```http
GET /feedback?recommendation_type=job
```

### Get Feedback Statistics
```http
GET /feedback/stats
```

**Response:**
```json
{
  "total_feedback": 10,
  "average_rating": 4.2,
  "helpful_count": 8,
  "not_helpful_count": 2,
  "by_type": {}
}
```

---

## Existing AI Engine Integration

These endpoints are part of the existing AI engine (black-box) and are called internally by the Guidance module:

- `POST /skills/extract` - Extract skills from resume
- `POST /skills/gap` - Skill gap analysis
- `POST /jobs/recommend` - Job recommendations
- `POST /learning/path` - Generate learning path
- `GET /skills/occupations` - Get available occupations

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request data"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```



