import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    if (result.success) {
      navigate('/app/dashboard')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 px-4 py-10 animate-fade-in overflow-hidden">
      <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block text-gray-800 animate-slide-in-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-white/80 text-sm mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            Career growth starts here
          </div>

          <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome back to SkillSync
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl">
            Continue your learning plan, track skill progress, and get targeted recommendations for your next role.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Personalized guidance based on your goals</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              <span>Skill gap insights with clear next actions</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <span>Learning and job recommendations in one place</span>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 border border-white/80 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            Stay consistent and keep improving every week
          </div>
        </div>

        <div className="max-w-md w-full justify-self-center space-y-8 p-8 rounded-2xl shadow-xl border border-white/80 animate-scale-in bg-white/90 backdrop-blur-sm">
          <div className="animate-slide-down">
            <BrandLogo to="/" textSize="text-3xl" iconSize="w-10 h-10" />
            <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          </div>

          <form className="mt-8 space-y-6 animate-fade-in" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded animate-slide-down">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                  placeholder="you@example.com"
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                  placeholder="********"
                />
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 hover:opacity-90"
                style={{ background: 'linear-gradient(to right, #A855F7, #EC4899, #3B82F6)' }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link to="/register" className="text-sm text-gray-600 hover:text-primary transition-colors duration-300">
                Don't have an account? <span className="font-medium bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Register</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
