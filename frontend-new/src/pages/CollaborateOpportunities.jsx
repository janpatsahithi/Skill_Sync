import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Flame, MapPin } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { collaborateAPI } from '../services/api'

const typeFilters = ['All', 'Hackathon', 'Internship', 'Workshop', 'Competition']

const CollaborateOpportunities = () => {
  const [opportunities, setOpportunities] = useState([])
  const [typeFilter, setTypeFilter] = useState('All')
  const [deadlineSoon, setDeadlineSoon] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadOpportunities = async () => {
    try {
      setLoading(true)
      const params = {}
      if (typeFilter !== 'All') params.type = typeFilter
      if (deadlineSoon) params.deadline_soon = true
      if (featuredOnly) params.featured = true

      const response = await collaborateAPI.getOpportunities(params)
      setOpportunities(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading opportunities:', error)
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOpportunities()
  }, [typeFilter, deadlineSoon, featuredOnly])

  const shaped = useMemo(() => {
    return opportunities.map((opportunity) => {
      const now = Date.now()
      const deadlineTs = new Date(opportunity.deadline).getTime()
      const daysLeft = Number.isFinite(deadlineTs)
        ? Math.max(0, Math.ceil((deadlineTs - now) / (1000 * 60 * 60 * 24)))
        : 999

      return {
        ...opportunity,
        daysLeft,
      }
    })
  }, [opportunities])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">Opportunities</h1>
        <p className="text-text-secondary">Curated career opportunities with deadlines and urgency indicators.</p>
      </div>

      <Card className="rounded-2xl border-primary/20 bg-white/85">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  typeFilter === type
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-primary/15 text-text-secondary hover:text-text-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeadlineSoon((value) => !value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                deadlineSoon ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Deadline Soon
            </button>
            <button
              onClick={() => setFeaturedOnly((value) => !value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                featuredOnly ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Featured
            </button>
          </div>
        </div>
      </Card>

      {loading ? <div className="text-text-secondary">Loading opportunities...</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {shaped.map((opportunity) => (
          <Card key={opportunity.id} className="rounded-2xl border-primary/15 bg-white/90 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                {opportunity.type}
              </span>
              {opportunity.daysLeft <= 3 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold px-2.5 py-1">
                  <Flame className="w-3.5 h-3.5" />
                  Closing Soon
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-text-primary">{opportunity.title}</h3>
            <p className="text-sm text-text-secondary mt-2 line-clamp-3">{opportunity.description}</p>

            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              <p>
                Deadline:{' '}
                <span className={opportunity.daysLeft <= 3 ? 'font-semibold text-rose-700' : 'font-medium text-text-primary'}>
                  {new Date(opportunity.deadline).toLocaleDateString()}
                </span>
              </p>
              <p className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {opportunity.location || 'Remote / Flexible'}
              </p>
            </div>

            <a href={opportunity.apply_link} target="_blank" rel="noreferrer" className="inline-block mt-5">
              <Button size="sm">
                Apply Now
                <ExternalLink className="w-4 h-4 ml-1.5" />
              </Button>
            </a>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CollaborateOpportunities
