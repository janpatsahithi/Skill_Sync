# SkillWeave - Full Stack Career Development Platform

## Project Overview
SkillWeave is a comprehensive career development platform that helps users analyze their skills, identify skill gaps, get job recommendations, and create personalized learning paths.

## Architecture

### Backend
- **Framework**: FastAPI (Python)
- **Port**: 8000
- **Database**: MongoDB
- **Key Features**: 
  - Resume parsing and skill extraction
  - Skill gap analysis
  - Job recommendations
  - AI-powered learning path generation
  - RAG-based chat advisor

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Port**: 8080
- **State Management**: React Context
- **Location**: `/frontend2`

---

## Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **MongoDB** (local or cloud instance)
- **pip** and **npm/yarn/bun** package managers

---

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r app/requirements.txt
```

### 4. Set up environment variables
Create a `.env` file in the backend root:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=skillweave
JWT_SECRET_KEY=your-secret-key-here
```

### 5. Run the backend
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend2
```

### 2. Install dependencies
```bash
npm install
# or
bun install
```

### 3. Set up environment variables
Create a `.env` file in the frontend2 root:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Run the development server
```bash
npm run dev
# or
bun run dev
```

The frontend will be available at `http://localhost:8080`

---

## API Endpoints

### Authentication
- `POST /users/register` - Register new user
- `POST /users/login` - Login user

### Resume Management
- `POST /resume/upload` - Upload and parse resume

### Skills
- `POST /skills/extract` - Extract skills from text
- `POST /skills/gap` - Analyze skill gaps
- `GET /skills/occupations` - Get list of occupations

### Analysis
- `POST /analysis/gap` - Detailed skill gap analysis

### Jobs
- `POST /jobs/recommend` - Get job recommendations

### Learning
- `POST /learning/path` - Generate personalized learning path

### Careers
- `GET /careers/recommend` - Get career recommendations

### AI Advisor
- `POST /rag/chat` - Chat with AI career advisor

### Profile
- `GET /api/profile` - Get user profile (requires auth)

### Health
- `GET /health` - Health check
- `GET /health/datasets` - Dataset statistics

---

## Features

### 1. User Authentication
- User registration and login
- JWT-based authentication
- Secure password hashing

### 2. Resume Analysis
- Parse PDF, DOC, DOCX files
- Automatic skill extraction
- Skill mapping to ESCO taxonomy

### 3. Skill Gap Analysis
- Compare user skills with occupation requirements
- Calculate match score
- Identify missing skills

### 4. Job Recommendations
- Get relevant job opportunities
- Match jobs based on user skills
- Display job details and requirements

### 5. Learning Path Generation
- Create personalized learning paths
- Suggest courses and resources
- Track learning progress

### 6. AI Advisor
- Chat with AI-powered career advisor
- Get personalized advice
- RAG-based information retrieval

---

## Project Structure

```
skillweave-guide/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core utilities (security, config)
│   │   ├── datasets/         # Dataset files
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Configuration
│   │   ├── schemas.py        # Pydantic models
│   │   └── requirements.txt   # Python dependencies
│   └── .env                  # Environment variables
│
├── frontend2/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React Context (Auth, Skills)
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── package.json          # Node dependencies
│   ├── .env                  # Environment variables
│   └── vite.config.ts        # Vite configuration
│
└── README.md                 # This file
```

---

## Running the Full Application

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend2
npm run dev
```

Then open your browser to `http://localhost:8080`

---

## Authentication Flow

1. User registers with email and password
2. Backend validates and stores user in MongoDB
3. User logs in with credentials
4. Backend issues JWT token
5. Token is stored in localStorage
6. Token is sent in Authorization header for protected routes

---

## Key Technologies

### Backend
- FastAPI - Modern Python web framework
- SQLAlchemy - SQL toolkit and ORM
- PyMongo - MongoDB driver
- Spacy - NLP for text processing
- Sentence Transformers - Semantic similarity
- FAISS - Vector similarity search

### Frontend
- React 18 - UI library
- Vite - Fast build tool
- Tailwind CSS - Utility-first CSS
- Shadcn/ui - Component library
- React Router - Client-side routing
- Lucide Icons - Icon library

---

## Troubleshooting

### CORS Issues
If you see CORS errors, make sure:
1. Backend has CORS middleware enabled
2. Frontend API URL matches backend origin
3. Check `VITE_API_BASE_URL` in frontend `.env`

### MongoDB Connection
- Ensure MongoDB is running locally or provide valid connection string
- Check `MONGODB_URL` in backend `.env`

### Port Conflicts
- Backend default: 8000
- Frontend default: 8080
- Change ports if conflicts occur in `vite.config.ts` and backend start command

---

## Deployment

### Backend (production)
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (production build)
```bash
npm run build
npm run preview
```

---

## Contributing
Guidelines for contributing to the project...

---

## License
MIT License - feel free to use this project!

---

## Support
For issues and questions, please open an issue on the repository.
