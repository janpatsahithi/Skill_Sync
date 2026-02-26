import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userContextAPI } from '../services/api'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  useEffect(() => {
    if (!user) return
    if (location.pathname === '/app/onboarding') {
      setOnboardingChecked(true)
      setOnboardingCompleted(true)
      return
    }
    userContextAPI
      .get()
      .then((res) => {
        setOnboardingCompleted(res.data?.onboarding_completed ?? false)
      })
      .catch(() => {
        setOnboardingCompleted(false)
      })
      .finally(() => setOnboardingChecked(true))
  }, [user, location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!onboardingCompleted && location.pathname !== '/app/onboarding') {
    return <Navigate to="/app/onboarding" replace />
  }

  return children
}

export default ProtectedRoute
