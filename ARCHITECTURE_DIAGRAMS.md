# System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SKILLWEAVE APPLICATION                          │
└─────────────────────────────────────────────────────────────────────┘

                        User Browser (localhost:8080)
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND2 (React + Vite)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React Components                           │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │   Login      │  │   Register   │  │   Resume     │        │  │
│  │  │   Page       │  │   Page       │  │   Upload     │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │   Skill Gap  │  │   Dashboard  │  │    Jobs      │        │  │
│  │  │   Analysis   │  │              │  │ Recommend.   │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│                              │ useAuth() / useSkills()               │
│                              ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Context Providers (State Management)             │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  ┌─────────────────────┐   ┌──────────────────────┐          │  │
│  │  │   AuthContext       │   │   SkillContext       │          │  │
│  │  ├─────────────────────┤   ├──────────────────────┤          │  │
│  │  │ - user              │   │ - currentSkills      │          │  │
│  │  │ - token             │   │ - skillGaps          │          │  │
│  │  │ - isAuthenticated   │   │ - occupations        │          │  │
│  │  │ - login()           │   │ - analyzeSkillGap()  │          │  │
│  │  │ - register()        │   │ - extractSkills()    │          │  │
│  │  │ - logout()          │   │ - updateSkills()     │          │  │
│  │  └─────────────────────┘   └──────────────────────┘          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│                              │ apiService.method()                   │
│                              ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │            API Service Layer (api.js)                         │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  - request(endpoint, options)                                 │  │
│  │  - login(email, password)                                     │  │
│  │  - register(name, email, password)                            │  │
│  │  - uploadResume(file)                                         │  │
│  │  - analyzeSkillGap(occupation)                                │  │
│  │  - getJobRecommendations(skills)                              │  │
│  │  - getOccupations()                                           │  │
│  │  - Token management & error handling                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                               │ API Calls (JSON)
                               │ CORS Enabled
                               │ JWT Token in Headers
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI - localhost:8000)                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Application                         │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  CORS Middleware (allow localhost:8080)                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐      │
│  │  /users      │  │  /resume     │  │  /skills             │      │
│  │  - register  │  │  - upload    │  │  - extract           │      │
│  │  - login     │  │              │  │  - gap               │      │
│  └──────────────┘  └──────────────┘  │  - occupations       │      │
│  ┌──────────────┐  ┌──────────────┐  └──────────────────────┘      │
│  │  /analysis   │  │  /jobs       │  ┌──────────────────────┐      │
│  │  - gap       │  │  - recommend │  │  /learning           │      │
│  └──────────────┘  └──────────────┘  │  - path              │      │
│  ┌──────────────┐  ┌──────────────┐  └──────────────────────┘      │
│  │  /rag        │  │  /careers    │  ┌──────────────────────┐      │
│  │  - chat      │  │  - recommend │  │  /api                │      │
│  └──────────────┘  └──────────────┘  │  - profile           │      │
│                                       └──────────────────────┘      │
│                              │                                        │
│                              │ Data Processing                        │
│                              │ NLP, ML Models                        │
│                              │ Skill Matching                        │
│                              ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Business Logic & Services                        │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  - Resume parsing (PyMuPDF, pdfplumber, python-docx)         │  │
│  │  - Skill extraction (Spacy, Sentence Transformers)           │  │
│  │  - Skill matching (FAISS, RapidFuzz)                         │  │
│  │  - Job matching algorithms                                    │  │
│  │  - Authentication (JWT, bcrypt)                              │  │
│  │  - Learning path generation                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│                              │ Database Operations                   │
│                              ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Data Layer (MongoDB)                             │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  - users (registration, login)                               │  │
│  │  - resumes (parsed resumes, extracted skills)                │  │
│  │  - skills (skill database, mappings)                         │  │
│  │  - occupations (job roles, requirements)                     │  │
│  │  - jobs (job listings, matching)                             │  │
│  │  - learning_paths (personalized paths)                       │  │
│  │  - conversations (AI chat history)                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                               │
                               │ Database Connection
                               ▼
                        MongoDB Database
                        (localhost:27017)
```

---

## Data Flow: User Registration

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER REGISTRATION                            │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Register  │  User fills form (name, email, password)
│   Page      │
└──────┬──────┘
       │ Form submission
       ▼
┌─────────────────────────────────┐
│ useAuth().register()            │  Calls register function
│ AuthContext                     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ apiService.register()           │  POST /users/register
│ api.js                          │  + name, email, password
└──────┬──────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Backend: /users/register endpoint    │
│ - Hash password                      │
│ - Validate email                     │
│ - Store in MongoDB                   │
└──────┬───────────────────────────────┘
       │ Response: {message: "success"}
       ▼
┌─────────────────────────────────┐
│ AuthContext updates             │  Update state
│ localStorage clear              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Navigate to /upload             │  ResumeUpload page
│ User ready for next step        │
└─────────────────────────────────┘
```

---

## Data Flow: Resume Analysis

```
┌──────────────────────────────────────────────────────────────────────┐
│                          RESUME ANALYSIS                             │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ ResumeUpload     │  User selects resume file
│ Page             │  (PDF, DOC, DOCX)
└──────┬───────────┘
       │ File validation
       ├─ Type check (PDF, DOC, DOCX)
       ├─ Size check (< 5MB)
       │
       ▼
┌──────────────────────────────┐
│ apiService.uploadResume()    │  FormData with file
│ api.js                       │  POST /resume/upload
└──────┬───────────────────────┘
       │ File + JWT token
       ▼
┌──────────────────────────────────────────┐
│ Backend: /resume/upload endpoint         │
│ - Parse PDF/DOC/DOCX                     │
│ - Extract text                           │
│ - Run Spacy NLP                          │
│ - Extract skills                         │
│ - Validate against ESCO taxonomy         │
│ - Store parsed resume in DB              │
└──────┬───────────────────────────────────┘
       │ Response: {
       │   skills: ["React", "JavaScript", ...],
       │   text: "extracted text",
       │   entities: {...}
       │ }
       ▼
┌──────────────────────────────┐
│ ResumeUpload Component       │  Display extracted skills
│ - Show progress              │  - Update local state
│ - Display skill chips        │  - Show success message
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ updateCurrentSkills()        │  Store in SkillContext
│ SkillContext                 │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Navigate to /analysis        │  SkillGapAnalysis page
│ Skills ready for analysis    │
└──────────────────────────────┘
```

---

## Data Flow: Skill Gap Analysis

```
┌──────────────────────────────────────────────────────────────────────┐
│                       SKILL GAP ANALYSIS                             │
└──────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐
│ SkillGapAnalysis Page  │  User selects target occupation
│ - Load occupations     │  From occupation dropdown
└──────┬─────────────────┘
       │
       ├─ GET /skills/occupations (if needed)
       │  Response: ["Frontend Developer", "Backend Dev", ...]
       │
       ▼
┌──────────────────────────────┐
│ User selects occupation      │  e.g., "Frontend Developer"
│ setState(selectedOccupation) │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ analyzeSkillGap()                        │  SkillContext method
│ - currentSkills from context             │
│ - selectedOccupation from state          │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ apiService.analyzeSkillGap()             │
│ POST /analysis/gap                       │
│ {                                        │
│   current_skills: [...],                 │
│   target_occupation: "Frontend Dev"      │
│ }                                        │
└──────┬───────────────────────────────────┘
       │ With JWT token
       ▼
┌────────────────────────────────────────────────────────┐
│ Backend: /analysis/gap endpoint                        │
│ - Load occupation requirements                         │
│ - Compare user skills vs requirements                  │
│ - Calculate match score (0-100)                        │
│ - Identify missing skills                              │
│ - Use ML models for skill matching                     │
│ - Rank skills by importance                            │
└──────┬─────────────────────────────────────────────────┘
       │ Response: {
       │   match_score: 78,
       │   current_skills: [...],
       │   missing_skills: [...],
       │   recommendations: [...]
       │ }
       ▼
┌──────────────────────────────────────────┐
│ SkillGapAnalysis Component               │
│ - Display match score with ProgressRing  │
│ - Show current skills (green)            │
│ - Show missing skills (red)              │
│ - Display recommendations                │
└──────┬───────────────────────────────────┘
       │ Buttons available:
       ├─ "View Job Matches" → /jobs
       └─ "View Learning Path" → /learning
```

---

## Component Hierarchy

```
App (Router)
├── Layout
│   └── Navbar
│       └── NavLink
│   └── Footer (on some pages)
│
├── Index (/)
│   └── Index Page Components
│
├── Login (/login)
│   └── Form with validation
│
├── Register (/register)
│   └── Multi-field form
│
├── Dashboard (/dashboard)
│   ├── StatCard (4x)
│   ├── Skill Progress Display
│   └── Recommendations Display
│
├── ResumeUpload (/upload)
│   ├── File Upload Area
│   ├── Progress Bar
│   └── Skill Display
│
├── SkillGapAnalysis (/analysis)
│   ├── Occupation Selector
│   ├── ProgressRing
│   ├── SkillChip (multiple)
│   └── CTA Buttons
│
├── JobRecommendations (/jobs)
│   ├── Job Cards (multiple)
│   ├── Job Details
│   └── Skill Matching Display
│
├── LearningPath (/learning)
│   └── (Ready for implementation)
│
├── AIAdvisor (/aiadvisor)
│   └── (Ready for implementation)
│
└── NotFound (404)
```

---

## Authentication Flow Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION SEQUENCE                      │
└─────────────────────────────────────────────────────────────────┘

1. APP STARTUP
   ├─ main.jsx loads AuthProvider
   ├─ AuthContext checks localStorage for token
   └─ If token exists: setIsAuthenticated(true)

2. LOGIN ATTEMPT
   User → Login Form → useAuth().login(email, password)
   │
   ├─ API: POST /users/login {email, password}
   │
   ├─ Backend: Validate credentials
   │  ├─ Find user in DB
   │  └─ Verify password hash
   │
   ├─ If valid: Return JWT token
   │
   ├─ Frontend: Store token in localStorage
   │
   ├─ AuthContext: setToken(token)
   │
   └─ Redirect to /dashboard

3. API REQUESTS (WITH AUTH)
   ┌─ Every request adds Authorization header
   ├─ Header: "Authorization: Bearer {token}"
   └─ Backend verifies token before processing

4. PROTECTED ROUTES
   Dashboard.jsx checks isAuthenticated
   ├─ If true: Render component
   └─ If false: Redirect to /login

5. LOGOUT
   User → Logout button → useAuth().logout()
   │
   ├─ Clear localStorage token
   │
   ├─ AuthContext: setToken(null)
   │
   ├─ Clear user state
   │
   └─ Redirect to /login
```

---

## Database Schema (MongoDB)

```
Collections:
│
├── users
│   ├── _id (ObjectId)
│   ├── name (string)
│   ├── email (string, unique)
│   ├── password (string, hashed)
│   ├── role (string: "user", "admin")
│   └── created_at (timestamp)
│
├── resumes
│   ├── _id (ObjectId)
│   ├── user_id (ObjectId, ref users)
│   ├── filename (string)
│   ├── extracted_text (string)
│   ├── skills (array)
│   ├── entities (object)
│   └── uploaded_at (timestamp)
│
├── occupations
│   ├── _id (ObjectId)
│   ├── name (string)
│   ├── description (string)
│   ├── required_skills (array)
│   └── salary_range (object)
│
├── skills
│   ├── _id (ObjectId)
│   ├── name (string)
│   ├── category (string)
│   ├── level (integer)
│   └── mappings (object)
│
├── job_recommendations
│   ├── _id (ObjectId)
│   ├── user_id (ObjectId, ref users)
│   ├── job_title (string)
│   ├── company (string)
│   ├── match_score (number)
│   └── created_at (timestamp)
│
└── conversations
    ├── _id (ObjectId)
    ├── user_id (ObjectId, ref users)
    ├── messages (array of objects)
    │   ├── role (string: "user" or "assistant")
    │   └── content (string)
    └── created_at (timestamp)
```

---

## State Management Tree

```
App Root
│
├── AuthContext
│   ├── user (object)
│   ├── isAuthenticated (boolean)
│   ├── isLoading (boolean)
│   ├── error (string)
│   └── functions:
│       ├── login()
│       ├── register()
│       └── logout()
│
├── SkillContext
│   ├── currentSkills (array)
│   ├── extractedSkills (array)
│   ├── skillGaps (array)
│   ├── occupations (array)
│   ├── isLoading (boolean)
│   ├── error (string)
│   └── functions:
│       ├── extractSkills()
│       ├── analyzeSkillGap()
│       ├── fetchOccupations()
│       ├── updateCurrentSkills()
│       └── clearSkills()
│
└── Component Local State (various)
    ├── Form fields (login, register)
    ├── File upload state (resume)
    ├── Modal/accordion states
    └── UI visibility states
```

This comprehensive architecture provides a scalable, maintainable foundation for the SkillWeave platform!
