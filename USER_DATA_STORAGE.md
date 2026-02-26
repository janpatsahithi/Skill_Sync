# User Data Storage Documentation

## Overview
This document outlines all user data stored in the SkillSync database (MongoDB).

---

## 📊 Database Collections

### 1. **`users` Collection** (Basic Authentication)
**Location:** `backend/app/api/users.py`

**Stored Fields:**
- `_id` (ObjectId) - Unique user identifier
- `name` (string) - User's full name
- `email` (string) - User's email address (unique)
- `password` (string) - Hashed password (using Argon2)
- `role` (string) - User role (default: "user")

**When Created:** During user registration (`/users/register`)

---

### 2. **`user_context` Collection** (Profile & Career Context)
**Location:** `backend/app/api/user_context.py`

**Stored Fields:**
- `user_id` (string) - Reference to user
- `email` (string) - User's email (for lookup)
- `background` (string, optional) - Educational/work background
- `interests` (array) - List of user interests/tags
- `career_goals` (string, optional) - Short/long-term career goals
- `preferences` (object) - User preferences including:
  - `location` (string) - Location preference
  - `profileVisibility` (string) - Privacy setting
  - `showEmail` (boolean) - Email visibility
  - `showSkills` (boolean) - Skills visibility
  - `allowMessages` (boolean) - Message permissions
- `availability_hours_per_week` (integer, optional) - Available hours
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**When Created:** When user creates/updates profile (`/user-context` POST/PUT)

---

### 3. **`user_skills` Collection** (Extracted Skills)
**Location:** `backend/app/api/skills.py`, `backend/app/api/resume.py`

**Stored Fields:**
- `user_id` (string, optional) - Reference to user
- `email` (string) - User's email (for lookup)
- `skills` (array) - List of extracted skills, each containing:
  - `skill` (string) - Skill name
  - `uri` (string) - ESCO skill URI
  - `confidence` (float) - Extraction confidence score
- `updated_at` (datetime) - Last update timestamp

**When Created:** When user uploads resume or extracts skills (`/resume/upload` or `/skills/extract`)

---

### 4. **`resumes` Collection** (Resume Files)
**Location:** `backend/app/api/resume.py`

**Stored Fields:**
- `user_id` (string) - Reference to user
- `filename` (string) - Original filename
- `text` (string) - Extracted text content from resume
- `uploaded_at` (datetime) - Upload timestamp

**When Created:** When user uploads a resume file (`/resume/upload`)

---

### 5. **`goals` Collection** (Career Goals)
**Location:** `backend/app/api/planning.py`

**Stored Fields:**
- `_id` (ObjectId) - Unique goal identifier
- `user_id` (string) - Reference to user
- `title` (string) - Goal title
- `description` (string, optional) - Goal description
- `goal_type` (string) - "short_term" or "long_term"
- `status` (string) - "active", "completed", "paused"
- `target_date` (datetime, optional) - Target completion date
- `linked_occupation_uri` (string, optional) - Related occupation
- `progress_percentage` (float) - Progress tracking
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**When Created:** When user creates a goal (`/planning/goals` POST)

---

### 6. **`tasks` Collection** (Tasks Linked to Goals)
**Location:** `backend/app/api/planning.py`

**Stored Fields:**
- `_id` (ObjectId) - Unique task identifier
- `user_id` (string) - Reference to user
- `goal_id` (string) - Reference to parent goal
- `title` (string) - Task title
- `description` (string, optional) - Task description
- `status` (string) - "pending", "in_progress", "completed"
- `due_date` (datetime, optional) - Due date
- `is_ai_suggested` (boolean) - Whether task was AI-generated
- `linked_recommendation_id` (string, optional) - Related recommendation
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**When Created:** When user creates a task (`/planning/tasks` POST)

---

### 7. **`posts` Collection** (Community Posts)
**Location:** `backend/app/api/community.py`

**Stored Fields:**
- `_id` (ObjectId) - Unique post identifier
- `user_id` (string) - Reference to user
- `author_name` (string) - User's name (for display)
- `title` (string) - Post title
- `content` (string) - Post content
- `category` (string) - "projects", "discussions", "career-advice", "opportunities", "general"
- `tags` (array) - Skill tags associated with post
- `upvotes` (integer) - Upvote count
- `comment_count` (integer) - Comment count
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**When Created:** When user creates a community post (`/community/posts` POST)

---

### 8. **`comments` Collection** (Comments on Posts)
**Location:** `backend/app/api/community.py`

**Stored Fields:**
- `_id` (ObjectId) - Unique comment identifier
- `post_id` (string) - Reference to parent post
- `user_id` (string) - Reference to user
- `author_name` (string) - User's name (for display)
- `content` (string) - Comment content
- `parent_comment_id` (string, optional) - For nested comments
- `upvotes` (integer) - Upvote count
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**When Created:** When user comments on a post (`/community/posts/{id}/comments` POST)

---

### 9. **`resources` Collection** (Learning Resources)
**Location:** `backend/app/api/resources.py`

**Stored Fields:**
- `_id` (ObjectId) - Unique resource identifier
- `user_id` (string) - Reference to user
- `title` (string) - Resource title
- `url` (string) - Resource URL
- `description` (string, optional) - Resource description
- `resource_type` (string) - "article", "video", "course", "book", "tool"
- `tags` (array) - Tags for categorization
- `notes` (string, optional) - User's personal notes
- `status` (string) - "saved", "in_progress", "completed"
- `is_ai_recommended` (boolean) - Whether AI recommended this
- `linked_recommendation_id` (string, optional) - Related recommendation
- `created_at` (datetime) - Creation timestamp
- `updated_at` (datetime) - Last update timestamp

**When Created:** When user saves a resource (`/resources` POST)

---

### 10. **`feedback` Collection** (User Feedback)
**Location:** `backend/app/api/feedback.py`

**Stored Fields:**
- `_id` (ObjectId) - Unique feedback identifier
- `user_id` (string) - Reference to user
- `recommendation_id` (string, optional) - Related recommendation
- `recommendation_type` (string, optional) - "job", "learning", "skill"
- `rating` (integer) - Rating 1-5
- `feedback_text` (string, optional) - Feedback comment
- `was_helpful` (boolean) - Helpfulness flag
- `reflection_notes` (string, optional) - User reflection
- `created_at` (datetime) - Creation timestamp

**When Created:** When user submits feedback (`/feedback` POST)

---

## 📋 Summary of User Data Stored

### ✅ **Stored User Data:**

1. **Authentication Data:**
   - Name, Email, Password (hashed), Role

2. **Profile & Career Context:**
   - Background, Interests, Career Goals
   - Preferences (location, privacy settings)
   - Availability hours

3. **Skills Data:**
   - Extracted skills from resume
   - Skill URIs and confidence scores

4. **Resume Data:**
   - Resume filename and extracted text

5. **Goals & Tasks:**
   - Career goals (short/long-term)
   - Tasks linked to goals
   - Progress tracking

6. **Community Activity:**
   - Posts created
   - Comments made
   - Upvotes given

7. **Learning Resources:**
   - Saved resources
   - Personal notes on resources
   - Resource status

8. **Feedback:**
   - Ratings and feedback on recommendations
   - Reflection notes

---

## ❌ **NOT Currently Stored (But Available in Frontend):**

1. **Settings Preferences:**
   - Notification preferences (email, push, messages, learning, community)
   - Currently stored in `preferences` object but may need explicit fields

2. **Profile Picture/Avatar:**
   - Not currently implemented

3. **Social Connections:**
   - Friends/followers not implemented

4. **Message Threads:**
   - Currently using comments system, not dedicated messaging

---

## 🔒 **Data Privacy & Security:**

- Passwords are hashed using Argon2
- User data is linked via `user_id` and `email`
- All endpoints require authentication (except public endpoints)
- User can only access their own data

---

## 📝 **Notes:**

- All timestamps use UTC
- MongoDB ObjectIds are converted to strings for API responses
- User context can be created/updated via `/user-context` endpoints
- Skills are automatically extracted and stored when resume is uploaded
- All user-generated content (posts, comments, resources) is linked to user_id
