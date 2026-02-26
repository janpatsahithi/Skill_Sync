import { CalendarDays, ChevronRight, Flame, TrendingUp } from 'lucide-react'
import Button from '../ui/Button'

const typeStyles = {
  Hackathon: 'bg-fuchsia-100 text-fuchsia-700',
  Internship: 'bg-sky-100 text-sky-700',
  Workshop: 'bg-emerald-100 text-emerald-700',
  Competition: 'bg-amber-100 text-amber-700',
}

const OpportunityCard = ({ opportunity }) => {
  const isClosingSoon = opportunity.daysLeft <= 3
  const chipClass = typeStyles[opportunity.type] || 'bg-primary/10 text-primary'

  return (
    <article className="rounded-2xl border border-primary/15 bg-white/80 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${chipClass}`}>
          {opportunity.type}
        </span>
        <div className="flex items-center gap-2">
          {opportunity.trending && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold bg-blue-500/10 text-blue-600">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
          {isClosingSoon && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold bg-rose-500/10 text-rose-600">
              <Flame className="w-3 h-3" />
              Closing Soon
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-text-primary leading-tight">{opportunity.title}</h3>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">{opportunity.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs text-text-secondary">
          <CalendarDays className="w-4 h-4" />
          <span>Deadline: {opportunity.deadlineLabel}</span>
        </div>
        <Button size="sm" className="text-sm">
          View Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </article>
  )
}

export default OpportunityCard
