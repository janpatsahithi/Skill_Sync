import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SkillProvider } from './context/SkillContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Guidance from './pages/Guidance'
import Planning from './pages/Planning'
import Community from './pages/Community'
import CollaborateOverview from './pages/CollaborateOverview'
import CollaborateProjects from './pages/CollaborateProjects'
import CollaborateProjectDetail from './pages/CollaborateProjectDetail'
import CollaborateOpportunities from './pages/CollaborateOpportunities'
import MyTeams from './pages/MyTeams'
import Resources from './pages/Resources'
import ResumeUpload from './pages/ResumeUpload'
import ExtractedSkills from './pages/ExtractedSkills'
import SkillGapAnalysis from './pages/SkillGapAnalysis'
import LearningPath from './pages/LearningPath'
import JobRecommendations from './pages/JobRecommendations'
import AIAdvisor from './pages/AIAdvisor'
import Onboarding from './pages/Onboarding'
import Skills from './pages/Skills'
import Projects from './pages/Projects'
import Messaging from './pages/Messaging'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import SystemHealth from './pages/SystemHealth'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <SkillProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="skills" element={<Skills />} />
              <Route path="learning-path" element={<LearningPath />} />
              <Route path="collaborate" element={<CollaborateOverview />} />
              <Route path="collaborate/projects" element={<CollaborateProjects />} />
              <Route path="collaborate/projects/:id" element={<CollaborateProjectDetail />} />
              <Route path="collaborate/opportunities" element={<CollaborateOpportunities />} />
              <Route path="collaborate/my-teams" element={<MyTeams />} />
              <Route path="community" element={<Community />} />
              <Route path="projects" element={<Projects />} />
              <Route path="messaging" element={<Messaging />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="system-health" element={<SystemHealth />} />
              {/* Legacy routes for backward compatibility */}
              <Route path="resume-upload" element={<ResumeUpload />} />
              <Route path="extracted-skills" element={<ExtractedSkills />} />
              <Route path="skill-gap-analysis" element={<SkillGapAnalysis />} />
              <Route path="job-recommendations" element={<JobRecommendations />} />
              <Route path="ai-advisor" element={<AIAdvisor />} />
              <Route path="guidance" element={<Guidance />} />
              <Route path="planning" element={<Planning />} />
              <Route path="resources" element={<Resources />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SkillProvider>
    </AuthProvider>
  )
}

export default App
