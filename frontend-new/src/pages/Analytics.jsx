import { useState, useEffect } from 'react'
import { feedbackAPI } from '../services/api'
import { BarChart3, Star, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, Heart } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const Analytics = () => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    categories: {},
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({
    category: 'general',
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await feedbackAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error loading feedback stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await feedbackAPI.createFeedback(feedback)
      setShowFeedbackForm(false)
      setFeedback({ category: 'general', rating: 5, comment: '' })
      loadStats()
      alert('Thank you for your feedback!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">Analytics & Feedback</h1>
          <p className="text-text-secondary">View feedback statistics and submit your own feedback</p>
        </div>
        <Button onClick={() => setShowFeedbackForm(true)}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Submit Feedback
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Feedback</p>
              <p className="text-3xl font-bold text-text-primary">{stats.totalFeedback}</p>
            </div>
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-text-primary">{stats.averageRating.toFixed(1)}</p>
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
            <TrendingUp className="w-10 h-10 text-secondary" />
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Positive Sentiment</p>
              <p className="text-3xl font-bold text-text-primary">
                {stats.totalFeedback > 0
                  ? Math.round(
                      ((stats.ratings[5] + stats.ratings[4]) / stats.totalFeedback) * 100
                    )
                  : 0}
                %
              </p>
            </div>
            <Heart className="w-10 h-10 text-primary" />
          </div>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">Rating Distribution</h2>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratings[rating] || 0
            const percentage = stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium text-text-primary">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: rating >= 4
                          ? 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #3B82F6 100%)'
                          : rating === 3
                          ? 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
                          : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm text-text-secondary w-16 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(stats.categories).length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">Feedback by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.categories).map(([category, count]) => (
              <div
                key={category}
                className="p-4 rounded-lg border border-primary-200 bg-primary-50"
              >
                <p className="font-medium text-text-primary capitalize">{category}</p>
                <p className="text-2xl font-bold text-primary mt-2">{count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feedback Form Modal */}
      <Modal
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        title="Submit Feedback"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowFeedbackForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Category
            </label>
            <select
              value={feedback.category}
              onChange={(e) => setFeedback({ ...feedback, category: e.target.value })}
              className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="general">General</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="improvement">Improvement</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFeedback({ ...feedback, rating })}
                  className={`p-2 rounded-lg transition-all ${
                    feedback.rating >= rating
                      ? 'text-yellow-500'
                      : 'text-gray-300'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Comment
            </label>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tell us what you think..."
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Analytics
