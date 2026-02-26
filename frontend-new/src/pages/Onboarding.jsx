import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Briefcase, Sparkles, Check } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { userContextAPI } from '../services/api'

  const Onboarding = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: '',
    interests: [],
    resumeUploaded: false,
  })

  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap, description: 'Learning and building skills' },
    { id: 'professional', label: 'Professional', icon: Briefcase, description: 'Advancing career' },
    { id: 'creator', label: 'Creator', icon: Sparkles, description: 'Building projects' },
  ]

  const interests = [
    { id: 'skills', label: 'Skills Development', icon: '🎯' },
    { id: 'learning', label: 'Learning Paths', icon: '📚' },
    { id: 'community', label: 'Community', icon: '👥' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
  ]

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    try {
      await userContextAPI.update({
        onboarding_completed: true,
        onboarding_data: formData,
        interests: formData.interests || [],
      })
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await userContextAPI.create({
            interests: formData.interests || [],
            onboarding_completed: true,
            onboarding_data: formData,
          })
        } catch (createErr) {
          console.error('Error creating user context:', createErr)
          alert('Failed to save onboarding data. Please try again.')
          return
        }
      } else {
        console.error('Error updating user context:', err)
        alert('Failed to save onboarding data. Please try again.')
        return
      }
    }
    localStorage.setItem('onboarding_completed', 'true')
    localStorage.setItem('onboarding_data', JSON.stringify(formData))
    navigate('/app/dashboard')
  }

  const toggleInterest = (interestId) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
      <div className="w-full max-w-2xl mx-4">
        <div className="bg-background-card rounded-2xl shadow-xl p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">Step {step} of 3</span>
              <span className="text-sm font-medium text-text-secondary">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-primary-100 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Name & Role */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">Welcome to SkillSync!</h2>
              <p className="text-text-secondary mb-6">Let's personalize your experience</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    What best describes you?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roles.map((role) => {
                      const Icon = role.icon
                      return (
                        <button
                          key={role.id}
                          onClick={() => setFormData({ ...formData, role: role.id })}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                            formData.role === role.id
                              ? 'border-primary bg-primary-50'
                              : 'border-primary-100 hover:border-primary-200'
                          }`}
                        >
                          <Icon className="w-8 h-8 text-primary mb-2" />
                          <div className="font-medium text-text-primary">{role.label}</div>
                          <div className="text-sm text-text-secondary mt-1">{role.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold text-text-primary mb-2">What interests you?</h2>
              <p className="text-text-secondary mb-6">Select all that apply</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      formData.interests.includes(interest.id)
                        ? 'border-primary bg-primary-50'
                        : 'border-primary-100 hover:border-primary-200'
                    }`}
                  >
                    <div className="text-3xl mb-2">{interest.icon}</div>
                    <div className="font-medium text-text-primary">{interest.label}</div>
                    {formData.interests.includes(interest.id) && (
                      <Check className="w-5 h-5 text-primary mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Resume Upload (Optional) */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">You're All Set</h2>
              <p className="text-text-secondary mb-6">Click Complete Setup to finish onboarding.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.name || !formData.role)) ||
                (step === 2 && formData.interests.length === 0)
              }
            >
              {step === 3 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding


