import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  Lightbulb,
  BookOpen,
  Users,
  TrendingUp,
  FileText,
  Upload,
  Trash2,
  Calendar,
  CheckCircle,
  Eye,
  Loader2,
  Gauge,
  AlertTriangle,
} from 'lucide-react'
import { planningAPI, resourcesAPI, resumeAPI, skillsAPI, userContextAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    goals: 0,
    activeTasks: 0,
    resources: 0,
    resumes: 0,
    skillMatch: 0,
    missingSkills: 0,
  })
  const [summary, setSummary] = useState({
    targetRole: 'Set your target role',
    skillMatch: 0,
    nextSkill: 'Run skill gap analysis',
    priorityGap: 'Run skill gap analysis',
  })
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [resumesLoading, setResumesLoading] = useState(true)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewResume, setPreviewResume] = useState(null)
  const [previewError, setPreviewError] = useState('')
  const [previewPage, setPreviewPage] = useState(1)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const safeParse = (raw, fallback = null) => {
    try {
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  const humanizeRole = (roleValue) => {
    if (!roleValue) return ''
    let role = String(roleValue)
    if (role.includes('/')) {
      role = role.split('/').pop() || role
    }
    if (role.includes('#')) {
      role = role.split('#').pop() || role
    }
    role = decodeURIComponent(role)
    role = role.replace(/^fallback:\/\/role\//, '')
    role = role.replace(/[-_]/g, ' ').trim()
    return role
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ')
  }

  const getMissingSkills = (gap) => {
    if (!gap) return []
    if (Array.isArray(gap.missingSkills)) return gap.missingSkills
    if (Array.isArray(gap.missing_skills)) return gap.missing_skills
    return []
  }

  const deriveMatchScore = (gap, missingCount) => {
    if (Number.isFinite(gap?.match_score)) return Math.max(0, Math.min(100, Math.round(gap.match_score)))
    if (Number.isFinite(gap?.readiness_score)) return Math.max(0, Math.min(100, Math.round(gap.readiness_score * 100)))
    const extractedSkills = safeParse(localStorage.getItem('extracted_skills'), [])
    const skillCount = Array.isArray(extractedSkills) ? extractedSkills.length : 0
    const total = skillCount + missingCount
    if (total === 0) return 0
    return Math.round((skillCount / total) * 100)
  }

  const loadDashboardData = async () => {
    try {
      const [goalsRes, tasksRes, resourcesRes, resumesRes, userContextRes, userSkillsRes] = await Promise.all([
        planningAPI.getGoals(),
        planningAPI.getTasks({ status: 'pending' }),
        resourcesAPI.getResources(),
        resumeAPI.getResumes().catch(() => ({ data: { resumes: [] } })),
        userContextAPI.get().catch(() => ({ data: null })),
        skillsAPI.getMySkills().catch(() => ({ data: { skills: [] } })),
      ])

      const resumesList = Array.isArray(resumesRes?.data?.resumes) ? resumesRes.data.resumes : []
      const userSkillEntries = Array.isArray(userSkillsRes?.data?.skills) ? userSkillsRes.data.skills : []
      const hasUserSkills = userSkillEntries.length > 0
      const storedGap = hasUserSkills ? safeParse(localStorage.getItem('skill_gap_result'), {}) : {}
      const missingSkills = hasUserSkills ? getMissingSkills(storedGap) : []
      const missingCount = missingSkills.length
      const matchScore = hasUserSkills ? deriveMatchScore(storedGap, missingCount) : 0
      const contextData = userContextRes?.data || {}

      const inferredTargetRole =
        (hasUserSkills ? humanizeRole(storedGap?.occupation) : '') ||
        humanizeRole(contextData?.preferences?.target_role) ||
        humanizeRole(contextData?.target_role) ||
        'Target role not set'

      const nextSkill = hasUserSkills
        ? (missingSkills[0] || 'Add a target role to get recommendations')
        : 'Upload a resume to get recommendations'
      const priorityGap = hasUserSkills
        ? (missingSkills[1] || missingSkills[0] || 'No priority gap detected')
        : 'Upload a resume to start analysis'

      setSummary({
        targetRole: inferredTargetRole,
        skillMatch: matchScore,
        nextSkill,
        priorityGap,
      })

      setStats({
        goals: Array.isArray(goalsRes?.data) ? goalsRes.data.length : 0,
        activeTasks: Array.isArray(tasksRes?.data) ? tasksRes.data.length : 0,
        resources: Array.isArray(resourcesRes?.data) ? resourcesRes.data.length : 0,
        resumes: resumesList.length,
        skillMatch: matchScore,
        missingSkills: missingCount,
      })

      setResumes(resumesList)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setResumesLoading(false)
    }
  }

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      await resumeAPI.deleteResume(resumeId)
      setResumes(resumes.filter((r) => r.id !== resumeId))
      setStats((prev) => ({ ...prev, resumes: Math.max(0, prev.resumes - 1) }))
    } catch (error) {
      console.error('Error deleting resume:', error)
      alert('Failed to delete resume. Please try again.')
    }
  }

  const handlePreviewResume = async (resumeId) => {
    setIsPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewError('')
    setPreviewResume(null)
    setPreviewPage(1)
    try {
      const res = await resumeAPI.getResume(resumeId)
      setPreviewResume(res.data || null)
    } catch (error) {
      console.error('Error loading resume preview:', error)
      setPreviewError('Failed to load resume preview. Please try again.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const splitResumeIntoPages = (text, charsPerPage = 2200) => {
    if (!text) return []
    const paragraphs = text.split(/\n\s*\n/)
    const pages = []
    let current = ''

    for (const rawPara of paragraphs) {
      const para = rawPara.trim()
      if (!para) continue
      const candidate = current ? `${current}\n\n${para}` : para
      if (candidate.length <= charsPerPage) {
        current = candidate
      } else {
        if (current) pages.push(current)
        if (para.length <= charsPerPage) {
          current = para
        } else {
          for (let i = 0; i < para.length; i += charsPerPage) {
            pages.push(para.slice(i, i + charsPerPage))
          }
          current = ''
        }
      }
    }
    if (current) pages.push(current)
    return pages.length ? pages : [text]
  }

  if (loading) {
    return (
      <div className="text-center py-12 animate-pulse">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Career Goals',
      value: stats.goals,
      icon: Target,
      color: '#A855F7',
      link: '/app/planning',
    },
    {
      title: 'Skill Tasks',
      value: stats.activeTasks,
      icon: TrendingUp,
      color: '#3B82F6',
      link: '/app/planning',
    },
    {
      title: 'Saved Learning',
      value: stats.resources,
      icon: BookOpen,
      color: '#EC4899',
      link: '/app/resources',
    },
    {
      title: 'Resumes',
      value: stats.resumes,
      icon: FileText,
      color: '#EC4899',
      link: '/app/resume-upload',
    },
  ]

  const previewPages = splitResumeIntoPages(previewResume?.text || '')
  const totalPreviewPages = previewPages.length
  const previewPageText = totalPreviewPages > 0 ? previewPages[previewPage - 1] : ''

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-white/70 bg-white/65 shadow-sm p-6 transition-all duration-300">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
          Welcome back, {user?.name || 'there'} {String.fromCodePoint(0x1F44B)}
        </h1>
        <p className="text-gray-600">
          Continue your {summary.targetRole} journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </Link>
          )
        })}

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Skill Match Score</p>
            <Gauge className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{stats.skillMatch}%</p>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500"
              style={{ width: `${stats.skillMatch}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-secondary" />
            Missing Skills: <span className="font-semibold text-gray-900">{stats.missingSkills}</span>
          </div>
        </div>
      </div>

      <Card className="shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-1">
              Resume History
            </h2>
            <p className="text-sm text-gray-600">Track all your uploaded resumes</p>
          </div>
          <Link to="/app/resume-upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </Link>
        </div>

        {resumesLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading resumes...</div>
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No resumes uploaded yet</p>
            <p className="text-sm text-gray-500 mb-4">Upload your first resume to get started with skill analysis</p>
            <Link to="/app/resume-upload">
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => {
              const resumeTargetRole =
                humanizeRole(resume.target_role || resume.target_occupation || resume.occupation) || summary.targetRole
              const resumeMatchScore = Number.isFinite(resume.match_score)
                ? Math.round(resume.match_score)
                : Number.isFinite(resume.skill_match)
                  ? Math.round(resume.skill_match)
                  : stats.skillMatch

              return (
                <div
                  key={resume.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50/70 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center mt-0.5">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{resume.filename}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(resume.uploaded_at)}</span>
                        </div>
                        {resume.skills_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{resume.skills_count} skills extracted</span>
                          </div>
                        )}
                        {resume.file_size && (
                          <span className="text-xs">
                            {resume.file_size > 1024
                              ? `${(resume.file_size / 1024).toFixed(1)} KB`
                              : `${resume.file_size} chars`}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1">
                          Target Role: {resumeTargetRole}
                        </span>
                        <span className="rounded-full bg-secondary/10 text-secondary px-2.5 py-1">
                          Skill Match: {resumeMatchScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 lg:mt-0">
                    <Link
                      to="/app/skill-gap-analysis"
                      className="px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                    >
                      View Gap Report
                    </Link>
                    <button
                      onClick={() => handlePreviewResume(resume.id)}
                      className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-primary/10 hover:text-primary rounded-lg transition-colors flex items-center gap-1"
                      title="Preview resume"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <Link
                      to="/app/extracted-skills"
                      className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      View Skills
                    </Link>
                    <button
                      onClick={() => handleDeleteResume(resume.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewResume?.filename ? `Resume Preview: ${previewResume.filename}` : 'Resume Preview'}
        size="xl"
      >
        {previewLoading && (
          <div className="py-10 text-center text-text-secondary">
            <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
            Loading preview...
          </div>
        )}

        {!previewLoading && previewError && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm">
            {previewError}
          </div>
        )}

        {!previewLoading && !previewError && previewResume && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Uploaded: {formatDate(previewResume.uploaded_at)}</span>
              {totalPreviewPages > 0 && (
                <span>Page {previewPage} of {totalPreviewPages}</span>
              )}
            </div>
            <div className="rounded-lg border border-primary-100 bg-slate-100 p-4 max-h-[60vh] overflow-y-auto">
              {previewPageText ? (
                <div className="mx-auto w-full max-w-3xl min-h-[70vh] bg-white border border-slate-200 shadow-sm p-10">
                  <pre className="whitespace-pre-wrap text-[14px] text-slate-800 font-serif leading-7">
                    {previewPageText}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No preview text available for this resume.</p>
              )}
            </div>
            {totalPreviewPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-md border border-primary-200 text-text-primary disabled:opacity-50"
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  disabled={previewPage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-md border border-primary-200 text-text-primary disabled:opacity-50"
                  onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                  disabled={previewPage === totalPreviewPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link
              to="/app/resume-upload"
              className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Upload className="w-5 h-5 text-primary mr-3" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Upload Resume</span>
            </Link>
            <Link
              to="/app/guidance"
              className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Lightbulb className="w-5 h-5 text-primary mr-3" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Get Personalized Guidance</span>
            </Link>
            <Link
              to="/app/planning"
              className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Target className="w-5 h-5 text-secondary mr-3" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Create a New Goal</span>
            </Link>
            <Link
              to="/app/collaborate"
              className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Users className="w-5 h-5 text-secondary mr-3" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Join Collaborate Hub</span>
            </Link>
          </div>
        </div>

        <div className="rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-primary/15 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
          <h2 className="text-xl font-semibold text-text-primary mb-4">AI Summary</h2>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Current Target Role" value={summary.targetRole} />
            <SummaryRow label="Skill Match %" value={`${summary.skillMatch}%`} />
            <SummaryRow label="Recommended Next Skill" value={summary.nextSkill} />
            <SummaryRow label="Priority Skill Gap" value={summary.priorityGap} />
          </div>
          <Link
            to="/app/ai-advisor"
            className="inline-flex items-center mt-5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
          >
            Open AI Coach
          </Link>
        </div>
      </div>
    </div>
  )
}

const SummaryRow = ({ label, value }) => (
  <div className="bg-white/70 border border-white/80 rounded-lg px-3 py-2">
    <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">{label}</p>
    <p className="font-medium text-text-primary mt-0.5">{value}</p>
  </div>
)

export default Dashboard
