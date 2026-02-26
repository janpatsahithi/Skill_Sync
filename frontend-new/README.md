# SkillSync Frontend

User-centric intelligent support platform frontend built with React.

## Features

- **Dashboard**: Overview of goals, tasks, resources, and recommendations
- **Profile**: User context and profile management
- **Guidance**: Personalized recommendations from AI engine
- **Planning**: Goal and task management with progress tracking
- **Community**: Discussion forums for career, learning, and projects
- **Resources**: Save and organize learning resources

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React (icons)

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend-new
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
frontend-new/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── context/        # React context (auth)
│   ├── services/       # API client
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── package.json
```

## API Integration

The frontend communicates with the FastAPI backend at `http://localhost:8000` (configurable via `VITE_API_URL`).

All API calls are handled through the `services/api.js` module which includes:
- Authentication API
- User Context API
- Guidance API
- Planning API
- Community API
- Resources API
- Feedback API
- AI Engine API (for direct integration)

## Authentication

The app uses JWT tokens stored in localStorage. Protected routes require authentication.

## Navigation

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard
- `/profile` - User profile and context
- `/guidance` - Get personalized guidance
- `/planning` - Goals and tasks management
- `/community` - Community discussions
- `/resources` - Learning resources

## Styling

The app uses Tailwind CSS for styling. The design is clean and academic-focused, avoiding flashy animations.

## Development Notes

- All API calls include authentication tokens automatically
- Error handling is implemented at the API service level
- Loading states are managed per component
- Responsive design for mobile and desktop



