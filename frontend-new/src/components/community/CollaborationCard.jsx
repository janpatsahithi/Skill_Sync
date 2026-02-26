import { UserCircle2, Users2 } from 'lucide-react'
import Button from '../ui/Button'
import SkillChip from '../SkillChip'

const CollaborationCard = ({ collaboration, onRequestJoin }) => {
  return (
    <article className="rounded-2xl border border-primary/15 bg-white/80 p-5 shadow-sm hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-text-primary">{collaboration.title}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {(collaboration.skills || []).map((skill, index) => (
          <SkillChip key={`${collaboration.id}-skill-${index}`} skill={skill} variant="default" />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-text-secondary">
        <div className="inline-flex items-center gap-2">
          <Users2 className="w-4 h-4" />
          <span>{collaboration.teamSizeNeeded} teammates needed</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <UserCircle2 className="w-4 h-4" />
          <span>{collaboration.postedBy}</span>
        </div>
      </div>

      <div className="mt-5">
        <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => onRequestJoin(collaboration.id)}>
          Request to Join
        </Button>
      </div>
    </article>
  )
}

export default CollaborationCard
