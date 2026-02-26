import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Users2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import SkillChip from '../components/SkillChip'
import { collaborateAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const CollaborateProjectDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()

  const [project, setProject] = useState(null)
  const [requests, setRequests] = useState([])
  const [joinMessage, setJoinMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProject = async () => {
    try {
      setLoading(true)
      const projectRes = await collaborateAPI.getProject(id)
      const projectData = projectRes?.data
      setProject(projectData)

      if (projectData?.created_by === user?.id) {
        const reqRes = await collaborateAPI.getProjectRequests(id, { status: 'Pending' })
        setRequests(Array.isArray(reqRes?.data) ? reqRes.data : [])
      }
      setError('')
    } catch (err) {
      console.error('Error loading project detail:', err)
      setError(err?.response?.data?.detail || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
  }, [id, user?.id])

  const remainingSlots = useMemo(() => {
    if (!project) return 0
    return Math.max((project.team_size || 1) - (project.current_members?.length || 0), 0)
  }, [project])

  const isCreator = project?.created_by === user?.id

  const handleJoinRequest = async () => {
    try {
      await collaborateAPI.requestToJoin(id, { message: joinMessage || undefined })
      setJoinMessage('')
      loadProject()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send join request')
    }
  }

  const updateRequestStatus = async (requestId, status) => {
    try {
      await collaborateAPI.updateRequest(requestId, { status })
      loadProject()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update request')
    }
  }

  if (loading) {
    return <div className="text-text-secondary">Loading project...</div>
  }

  if (!project) {
    return <div className="text-red-600">Project not found.</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">Project Detail</p>
          <h1 className="text-3xl font-semibold text-text-primary">{project.title}</h1>
        </div>
        <Link to="/app/collaborate/projects" className="text-sm font-medium text-primary hover:underline">
          Back to Projects
        </Link>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <Card className="rounded-2xl border-primary/20 bg-white/85">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
            {project.project_type}
          </span>
          <span
            className={`rounded-full text-xs font-semibold px-2.5 py-1 ${
              project.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {project.status}
          </span>
        </div>

        <p className="text-text-primary leading-relaxed">{project.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(project.required_skills || []).map((skill, index) => (
            <SkillChip key={`${project.id}-detail-skill-${index}`} skill={skill} variant="default" />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-secondary">
          <div className="inline-flex items-center gap-2">
            <Users2 className="w-4 h-4" />
            Team: {project.current_members?.length || 0}/{project.team_size}
          </div>
          <div>Remaining slots: {remainingSlots}</div>
          <div className="inline-flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
          </div>
        </div>
      </Card>

      {!isCreator && (
        <Card className="rounded-2xl border-primary/20 bg-white/85">
          <h2 className="text-xl font-semibold text-text-primary mb-3">Request to Join</h2>
          <textarea
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-primary/20"
            placeholder="Share what you can contribute to this project"
            value={joinMessage}
            onChange={(event) => setJoinMessage(event.target.value)}
          />
          <div className="mt-3">
            <Button onClick={handleJoinRequest}>Request to Join</Button>
          </div>
        </Card>
      )}

      {isCreator && (
        <Card className="rounded-2xl border-primary/20 bg-white/85">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Join Requests</h2>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-text-secondary">No pending join requests.</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="border border-primary/15 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">{request.requester_name || 'User'}</p>
                      <p className="text-sm text-text-secondary mt-1">{request.message || 'No message provided.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => updateRequestStatus(request.id, 'Accepted')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        onClick={() => updateRequestStatus(request.id, 'Rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default CollaborateProjectDetail
