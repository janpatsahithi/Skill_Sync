import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Plus, Sparkles, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import CollaborationCard from '../components/community/CollaborationCard'
import OpportunityCard from '../components/community/OpportunityCard'
import ActivityIndicators from '../components/community/ActivityIndicators'
import { collaborateAPI } from '../services/api'

const CollaborateOverview = () => {
  const [overview, setOverview] = useState({
    active_projects: 0,
    open_join_requests: 0,
    opportunities_closing_this_week: 0,
  })
  const [projects, setProjects] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [skillMatches, setSkillMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [overviewRes, projectsRes, opportunitiesRes, matchesRes] = await Promise.all([
          collaborateAPI.getOverview(),
          collaborateAPI.getProjects({ status: 'Open', limit: 4, order: 'desc' }),
          collaborateAPI.getOpportunities({ limit: 4 }),
          collaborateAPI.getSkillMatches().catch(() => ({ data: [] })),
        ])

        setOverview(overviewRes?.data || overview)
        setProjects(Array.isArray(projectsRes?.data) ? projectsRes.data : [])
        setSkillMatches(Array.isArray(matchesRes?.data) ? matchesRes.data : [])

        const incomingOpportunities = Array.isArray(opportunitiesRes?.data) ? opportunitiesRes.data : []
        const shaped = incomingOpportunities.map((opportunity) => {
          const now = Date.now()
          const deadlineTs = new Date(opportunity.deadline).getTime()
          const daysLeft = Number.isFinite(deadlineTs)
            ? Math.max(0, Math.ceil((deadlineTs - now) / (1000 * 60 * 60 * 24)))
            : 99

          return {
            ...opportunity,
            deadlineLabel: opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'TBD',
            daysLeft,
            trending: Boolean(opportunity.is_featured),
          }
        })
        setOpportunities(shaped)
      } catch (error) {
        console.error('Error loading collaborate overview:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const topMatchesLabel = useMemo(() => {
    if (!skillMatches.length) return 'No matched projects yet. Add skills to unlock matching.'
    return `${skillMatches.length} projects looking for your skills.`
  }, [skillMatches])

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Loading collaborate hub...</div>
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="rounded-2xl border-primary/20 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase bg-primary/10 text-primary mb-3">
              Collaborate
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-text-primary leading-tight">
              Build Together. Grow Faster.
            </h1>
            <p className="mt-3 text-text-secondary text-base md:text-lg">
              Find teammates. Join hackathons. Build real projects.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/app/collaborate/projects">
              <Button variant="outline" className="border-primary/25 text-primary hover:bg-primary/10">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </Link>
            <Link to="/app/collaborate/opportunities">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Explore Opportunities
              </Button>
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Bell className="w-3.5 h-3.5" />
              {overview.open_join_requests} open join requests
            </span>
          </div>
        </div>
      </Card>

      <ActivityIndicators
        activeCollaborations={overview.active_projects}
        closingSoonCount={overview.opportunities_closing_this_week}
        newPostsCount={overview.open_join_requests}
      />

      <Card className="rounded-2xl border-primary/20 bg-white/80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">Skill Matching</p>
            <h2 className="text-xl font-semibold text-text-primary mt-1">{topMatchesLabel}</h2>
          </div>
          <Link to="/app/collaborate/projects">
            <Button variant="outline" className="border-primary/25 text-primary hover:bg-primary/10">
              <Users className="w-4 h-4 mr-2" />
              Find Teammates
            </Button>
          </Link>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Open Projects</h2>
            <p className="text-sm text-text-secondary">Teams currently looking for contributors.</p>
          </div>
          <Link to="/app/collaborate/projects" className="text-sm font-medium text-primary hover:underline">
            View all projects
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <CollaborationCard
              key={project.id}
              collaboration={{
                id: project.id,
                title: project.title,
                skills: project.required_skills || [],
                teamSizeNeeded: Math.max((project.team_size || 1) - (project.current_members?.length || 0), 0),
                postedBy: project.created_by_name || 'Project Owner',
              }}
              onRequestJoin={() => {}}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Opportunities</h2>
            <p className="text-sm text-text-secondary">Curated internships, hackathons, and workshops with deadlines.</p>
          </div>
          <Link to="/app/collaborate/opportunities" className="text-sm font-medium text-primary hover:underline">
            View all opportunities
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default CollaborateOverview
