import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Users2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SkillChip from '../components/SkillChip'
import { collaborateAPI } from '../services/api'

const MyTeams = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMyTeams = async () => {
      try {
        const response = await collaborateAPI.getMyTeams()
        setProjects(Array.isArray(response?.data) ? response.data : [])
      } catch (error) {
        console.error('Error loading my teams:', error)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadMyTeams()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">My Teams</h1>
        <p className="text-text-secondary">Projects where you are currently collaborating.</p>
      </div>

      {loading ? <div className="text-text-secondary">Loading teams...</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project) => (
          <Card key={project.id} className="rounded-2xl border-primary/15 bg-white/90 shadow-sm hover:shadow-md">
            <h3 className="text-lg font-semibold text-text-primary">{project.title}</h3>
            <p className="text-sm text-text-secondary mt-2 line-clamp-3">{project.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(project.required_skills || []).map((skill, idx) => (
                <SkillChip key={`${project.id}-my-skill-${idx}`} skill={skill} variant="default" />
              ))}
            </div>

            <div className="mt-4 text-sm text-text-secondary space-y-1">
              <p className="inline-flex items-center gap-1.5">
                <Users2 className="w-4 h-4" />
                {project.current_members?.length || 0}/{project.team_size} members
              </p>
              <p className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>

            <div className="mt-5">
              <Link to={`/app/collaborate/projects/${project.id}`}>
                <Button size="sm">Open Project</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {!loading && projects.length === 0 ? (
        <Card className="rounded-2xl border-primary/15 bg-white/90">
          <p className="text-text-secondary">You are not part of any team yet. Explore open projects and send a join request.</p>
          <div className="mt-3">
            <Link to="/app/collaborate/projects">
              <Button size="sm">Explore Projects</Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export default MyTeams
