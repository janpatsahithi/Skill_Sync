import { useState, useEffect } from 'react'
import { guidanceAPI, aiEngineAPI } from '../services/api'
import { Lightbulb, BookOpen, TrendingUp } from 'lucide-react'

const Guidance = () => {
  const [goalType, setGoalType] = useState('career_change')
  const [targetOccupation, setTargetOccupation] = useState('')
  const [occupations, setOccupations] = useState([])
  const [guidance, setGuidance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingOccupations, setLoadingOccupations] = useState(true)

  useEffect(() => {
    loadOccupations()
  }, [])

  const loadOccupations = async () => {
    try {
      const response = await aiEngineAPI.getOccupations()
      setOccupations(response.data || [])
    } catch (error) {
      console.error('Error loading occupations:', error)
    } finally {
      setLoadingOccupations(false)
    }
  }

  const handleGetGuidance = async () => {
    setLoading(true)
    setGuidance(null)
    try {
      const response = await guidanceAPI.getGuidance({
        goal_type: goalType,
        target_occupation_uri: targetOccupation || null,
        focus_areas: [],
      })
      setGuidance(response.data)
    } catch (error) {
      console.error('Error getting guidance:', error)
      alert('Error getting guidance. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'job':
        return TrendingUp
      case 'learning_resource':
        return BookOpen
      default:
        return Lightbulb
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Intelligent Guidance
        </h1>
        <p className="mt-2 text-text-secondary">
          Get personalized recommendations based on your goals and profile
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
          Request Guidance
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Goal Type
            </label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="career_change">Career Change</option>
              <option value="skill_development">Skill Development</option>
              <option value="job_search">Job Search</option>
            </select>
          </div>

          {goalType === 'career_change' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Target Occupation
              </label>
              {loadingOccupations ? (
                <p className="text-sm text-text-secondary">Loading occupations...</p>
              ) : (
                <select
                  value={targetOccupation}
                  onChange={(e) => setTargetOccupation(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select an occupation</option>
                  {occupations.map((occ) => (
                    <option key={occ.uri} value={occ.uri}>
                      {occ.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            onClick={handleGetGuidance}
            disabled={loading || (goalType === 'career_change' && !targetOccupation)}
            className="w-full px-4 py-2 text-white rounded-md disabled:opacity-50 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
          >
            {loading ? 'Getting Guidance...' : 'Get Recommendations'}
          </button>
        </div>
      </div>

      {guidance && (
        <div className="space-y-6">
          {guidance.skill_gap_analysis && (
            <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
                Skill Gap Analysis
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-text-secondary">Readiness Score</p>
                  <p className="text-2xl font-bold text-primary">
                    {(guidance.skill_gap_analysis.readiness_score * 100).toFixed(1)}%
                  </p>
                </div>
                {guidance.skill_gap_analysis.missing_essential && (
                  <div>
                    <p className="text-sm font-medium text-text-primary mb-2">
                      Missing Essential Skills ({guidance.skill_gap_analysis.missing_essential.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {guidance.skill_gap_analysis.missing_essential.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-accent-50 text-accent rounded-full text-sm border border-accent-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
              Recommendations
            </h2>
            <div className="space-y-4">
              {guidance.recommendations.map((rec, index) => {
                const Icon = getRecommendationIcon(rec.type)
                return (
                  <div
                    key={index}
                    className="border border-primary-100 rounded-lg p-4 hover:bg-primary-50/40 transition-colors"
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{rec.title}</h3>
                        <p className="text-sm text-text-secondary mt-1">{rec.description}</p>
                        <p className="text-xs text-text-secondary mt-2">
                          <strong>Reasoning:</strong> {rec.reasoning}
                        </p>
                        {rec.action_items && rec.action_items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-text-primary mb-1">
                              Action Items:
                            </p>
                            <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
                              {rec.action_items.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-text-secondary">
                          {(rec.relevance_score * 100).toFixed(0)}% relevant
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Guidance
