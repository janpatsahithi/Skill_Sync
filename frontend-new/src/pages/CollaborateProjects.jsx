import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Plus, Users2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import SkillChip from '../components/SkillChip'
import { collaborateAPI } from '../services/api'

const filters = ['All', 'Hackathon', 'Portfolio', 'Startup Idea', 'Open Source']

const CollaborateProjects = () => {
  const [projects, setProjects] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    required_skills: '',
    project_type: 'Hackathon',
    team_size: 4,
    deadline: '',
  })

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = { status: 'Open', order: 'asc', sort: 'deadline' }
      if (activeFilter !== 'All') {
        params.project_type = activeFilter
      }
      const response = await collaborateAPI.getProjects(params)
      setProjects(Array.isArray(response?.data) ? response.data : [])
      setError('')
    } catch (err) {
      console.error('Error loading collaborate projects:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [activeFilter])

  const createProject = async () => {
    try {
      const payload = {
        title: newProject.title,
        description: newProject.description,
        required_skills: newProject.required_skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        project_type: newProject.project_type,
        team_size: Number(newProject.team_size),
        deadline: newProject.deadline ? new Date(newProject.deadline).toISOString() : null,
      }
      await collaborateAPI.createProject(payload)
      setIsCreateOpen(false)
      setNewProject({
        title: '',
        description: '',
        required_skills: '',
        project_type: 'Hackathon',
        team_size: 4,
        deadline: '',
      })
      fetchProjects()
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err?.response?.data?.detail || 'Failed to create project')
    }
  }

  const totalOpenSlots = useMemo(() => {
    return projects.reduce((acc, project) => {
      const teamSize = project.team_size || 1
      const current = Array.isArray(project.current_members) ? project.current_members.length : 0
      return acc + Math.max(teamSize - current, 0)
    }, 0)
  }, [projects])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Projects</h1>
          <p className="text-text-secondary">Serious collaboration posts for resume-worthy work.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      <Card className="rounded-2xl border-primary/20 bg-white/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-primary/15 text-text-secondary hover:text-text-primary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <span className="text-sm text-text-secondary">{totalOpenSlots} open member slots</span>
        </div>
      </Card>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div className="text-text-secondary">Loading projects...</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project) => {
          const members = Array.isArray(project.current_members) ? project.current_members.length : 0
          const slotsLeft = Math.max((project.team_size || 1) - members, 0)
          return (
            <Card key={project.id} className="rounded-2xl border-primary/15 bg-white/90 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                  {project.project_type}
                </span>
                <span
                  className={`rounded-full text-xs font-semibold px-2.5 py-1 ${
                    project.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-text-primary">{project.title}</h3>
              <p className="text-sm text-text-secondary mt-2 line-clamp-3">{project.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(project.required_skills || []).map((skill, index) => (
                  <SkillChip key={`${project.id}-skill-${index}`} skill={skill} variant="default" />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
                <div className="inline-flex items-center gap-1.5">
                  <Users2 className="w-4 h-4" />
                  <span>{members}/{project.team_size} members</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-text-secondary">{slotsLeft} slot(s) left</span>
                <Link to={`/app/collaborate/projects/${project.id}`}>
                  <Button size="sm">View Details</Button>
                </Link>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Collaboration Project"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={createProject}>Create Project</Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="text-text-primary font-medium">Project Title</span>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/20"
              value={newProject.title}
              onChange={(event) => setNewProject({ ...newProject, title: event.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-text-primary font-medium">Description</span>
            <textarea
              rows={4}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/20"
              value={newProject.description}
              onChange={(event) => setNewProject({ ...newProject, description: event.target.value })}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-text-primary font-medium">Project Type</span>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/20"
                value={newProject.project_type}
                onChange={(event) => setNewProject({ ...newProject, project_type: event.target.value })}
              >
                <option>Hackathon</option>
                <option>Portfolio</option>
                <option>Startup Idea</option>
                <option>Open Source</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-text-primary font-medium">Team Size</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/20"
                value={newProject.team_size}
                onChange={(event) => setNewProject({ ...newProject, team_size: event.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-text-primary font-medium">Required Skills (comma separated)</span>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/20"
              placeholder="React, Python, UI/UX"
              value={newProject.required_skills}
              onChange={(event) => setNewProject({ ...newProject, required_skills: event.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-text-primary font-medium">Deadline</span>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-primary/20"
              value={newProject.deadline}
              onChange={(event) => setNewProject({ ...newProject, deadline: event.target.value })}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}

export default CollaborateProjects
