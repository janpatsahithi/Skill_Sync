import { Bell, Flame, Users } from 'lucide-react'

const ActivityIndicators = ({ activeCollaborations = 0, closingSoonCount = 0, newPostsCount = 0 }) => {
  const tiles = [
    {
      icon: Users,
      label: 'Active collaborations',
      value: activeCollaborations,
      accent: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Flame,
      label: 'Closing this week',
      value: closingSoonCount,
      accent: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      icon: Bell,
      label: 'New updates',
      value: newPostsCount,
      accent: 'text-blue-500',
      bg: 'bg-blue-500/10',
      badge: newPostsCount > 0 ? 'New' : null,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiles.map((tile) => {
        const Icon = tile.icon
        return (
          <div
            key={tile.label}
            className="rounded-2xl border border-primary/15 bg-white/75 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">{tile.label}</p>
                <p className="text-2xl font-semibold text-text-primary">{tile.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tile.bg}`}>
                <Icon className={`w-5 h-5 ${tile.accent}`} />
              </div>
            </div>
            {tile.badge && (
              <span className="mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-blue-500/10 text-blue-600">
                {tile.badge}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ActivityIndicators
