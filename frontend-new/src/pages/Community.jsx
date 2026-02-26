import { useMemo, useState } from 'react'
import { Bell, Plus, Sparkles, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import OpportunityCard from '../components/community/OpportunityCard'
import CollaborationCard from '../components/community/CollaborationCard'
import ActivityIndicators from '../components/community/ActivityIndicators'

const opportunityFilters = ['All', 'Hackathons', 'Internships', 'Workshops', 'Competitions']

const opportunities = [
  {
    id: 'opp-1',
    title: 'Smart India Hackathon 2026',
    type: 'Hackathon',
    deadlineLabel: 'Mar 04, 2026',
    daysLeft: 2,
    description: 'Join a national-level build sprint focused on civic innovation and product thinking.',
    trending: true,
  },
  {
    id: 'opp-2',
    title: 'Product Design Internship - Spring Cohort',
    type: 'Internship',
    deadlineLabel: 'Mar 11, 2026',
    daysLeft: 9,
    description: 'Work with startup mentors to ship user research and design systems for live products.',
    trending: true,
  },
  {
    id: 'opp-3',
    title: 'Backend Systems Workshop: Scalable APIs',
    type: 'Workshop',
    deadlineLabel: 'Mar 02, 2026',
    daysLeft: 1,
    description: 'Hands-on workshop on API design, observability, and resilient service architecture.',
    trending: false,
  },
  {
    id: 'opp-4',
    title: 'Campus AI Innovation Challenge',
    type: 'Competition',
    deadlineLabel: 'Mar 09, 2026',
    daysLeft: 7,
    description: 'Pitch and prototype practical AI solutions with cross-functional student teams.',
    trending: true,
  },
  {
    id: 'opp-5',
    title: 'Frontend Acceleration Bootcamp',
    type: 'Workshop',
    deadlineLabel: 'Mar 06, 2026',
    daysLeft: 4,
    description: 'Master modern React patterns, performance optimization, and deployment workflows.',
    trending: false,
  },
  {
    id: 'opp-6',
    title: 'Summer Engineering Internship Drive',
    type: 'Internship',
    deadlineLabel: 'Mar 03, 2026',
    daysLeft: 2,
    description: 'Apply to a curated shortlist of student-friendly roles from high-growth teams.',
    trending: true,
  },
]

const collaborations = [
  {
    id: 'col-1',
    title: 'Campus Placement Analytics Dashboard',
    skills: ['React', 'Python', 'UI/UX'],
    teamSizeNeeded: 2,
    postedBy: 'Aarav, Final Year CSE',
  },
  {
    id: 'col-2',
    title: 'AI Resume Coach for Students',
    skills: ['LLM Prompting', 'Node.js', 'Product Design'],
    teamSizeNeeded: 3,
    postedBy: 'Isha, 3rd Year IT',
  },
  {
    id: 'col-3',
    title: 'Open Source Skill Gap Visualizer',
    skills: ['Data Viz', 'TypeScript', 'FastAPI'],
    teamSizeNeeded: 1,
    postedBy: 'Rohit, 2nd Year CSE',
  },
]

const Community = () => {
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredOpportunities = useMemo(() => {
    if (activeFilter === 'All') return opportunities
    const singularFilter = activeFilter.endsWith('s') ? activeFilter.slice(0, -1) : activeFilter
    return opportunities.filter((opportunity) => opportunity.type === singularFilter)
  }, [activeFilter])

  const closingThisWeek = opportunities.filter((opportunity) => opportunity.daysLeft <= 7).length
  const newPostsCount = 4
  const activeCollaborations = 12

  const handleRequestJoin = (id) => {
    console.log(`Request to join collaboration: ${id}`)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="rounded-2xl border-primary/20 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase bg-primary/10 text-primary mb-3">
              Career Collaboration Hub
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-text-primary leading-tight">
              Build Together. Grow Faster.
            </h1>
            <p className="mt-3 text-text-secondary text-base md:text-lg">
              This is where ambitious students find teammates, discover real opportunities, and turn skills into real projects.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="border-primary/25 text-primary hover:bg-primary/10">
              <Users className="w-4 h-4 mr-2" />
              Find Teammates
            </Button>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Explore Opportunities
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Bell className="w-3.5 h-3.5" />
              {newPostsCount} new updates
            </span>
          </div>
        </div>
      </Card>

      <ActivityIndicators
        activeCollaborations={activeCollaborations}
        closingSoonCount={closingThisWeek}
        newPostsCount={newPostsCount}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Opportunities</h2>
            <p className="text-sm text-text-secondary">
              Curated events and career openings with clear deadlines and momentum signals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {opportunityFilters.map((filter) => {
              const isActive = filter === activeFilter
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white/80 text-text-secondary border border-primary/15 hover:border-primary/35 hover:text-text-primary'
                  }`}
                >
                  {filter}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Project Collaboration Hub</h2>
            <p className="text-sm text-text-secondary">
              Form serious project teams around complementary skills and execution goals.
            </p>
          </div>
          <Button variant="outline" className="border-primary/25 text-primary hover:bg-primary/10">
            <Plus className="w-4 h-4 mr-2" />
            Create Collaboration Post
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {collaborations.map((collaboration) => (
            <CollaborationCard
              key={collaboration.id}
              collaboration={collaboration}
              onRequestJoin={handleRequestJoin}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Community
