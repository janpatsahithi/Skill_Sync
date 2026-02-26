import { useState, useEffect } from 'react'
import { userContextAPI } from '../services/api'
import { Save } from 'lucide-react'

const Profile = () => {
  const [context, setContext] = useState({
    background: '',
    interests: [],
    career_goals: '',
    preferences: {},
    availability_hours_per_week: null,
  })
  const [newInterest, setNewInterest] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadUserContext()
  }, [])

  const loadUserContext = async () => {
    try {
      const response = await userContextAPI.get()
      if (response.data) {
        setContext(response.data)
      }
    } catch (error) {
      console.log('No user context found')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      if (context.background || context.interests.length > 0) {
        await userContextAPI.create(context)
        setMessage('Profile saved successfully!')
      }
    } catch (error) {
      setMessage('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const addInterest = () => {
    const trimmed = newInterest.trim()
    if (trimmed && !context.interests.includes(trimmed)) {
      setContext({
        ...context,
        interests: [...context.interests, trimmed],
      })
      setNewInterest('')
    }
  }

  const removeInterest = (interest) => {
    setContext({
      ...context,
      interests: context.interests.filter((i) => i !== interest),
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12 animate-pulse">
        <div className="text-text-secondary">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="animate-slide-down">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Profile & Context
        </h1>
        <p className="mt-2 text-text-secondary">
          Set up your profile to enable personalized recommendations
        </p>
      </div>

      <div className="rounded-lg border border-primary-100 bg-white shadow-sm p-6 space-y-6 animate-scale-in transition-all duration-300">
        <div className="animate-slide-up">
          <label className="block text-sm font-medium mb-2 text-text-primary">
            Background
          </label>
          <textarea
            value={context.background || ''}
            onChange={(e) => setContext({ ...context, background: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-primary-200 rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
            placeholder="Tell us about your educational background, work experience, and career journey..."
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <label className="block text-sm font-medium mb-2 text-text-primary">
            Interests
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              placeholder="Add an interest"
              className="flex-1 px-3 py-2 border border-primary-200 rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
            />
            <button
              onClick={addInterest}
              className="px-4 py-2 text-white rounded-md hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm border border-primary-200 bg-primary-50 text-primary"
              >
                {interest}
                <button
                  onClick={() => removeInterest(interest)}
                  className="ml-2 text-primary hover:text-primary-700 transition-colors"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm font-medium mb-2 text-text-primary">
            Career Goals
          </label>
          <textarea
            value={context.career_goals || ''}
            onChange={(e) => setContext({ ...context, career_goals: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-primary-200 rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
            placeholder="Describe your short-term and long-term career goals..."
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <label className="block text-sm font-medium mb-2 text-text-primary">
            Availability (hours per week)
          </label>
          <input
            type="number"
            value={context.availability_hours_per_week || ''}
            onChange={(e) =>
              setContext({
                ...context,
                availability_hours_per_week: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            min="0"
            max="168"
            className="w-full px-3 py-2 border border-primary-200 rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
            placeholder="e.g., 10"
          />
        </div>

        {message && (
          <div
            className={`p-4 rounded-md animate-slide-down border ${
              message.includes('Error')
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-primary-50 text-primary border-primary-200'
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-2 text-white rounded-md disabled:opacity-50 transition-all duration-300 hover:scale-105 animate-slide-up bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
          style={{ animationDelay: '0.4s' }}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}

export default Profile
