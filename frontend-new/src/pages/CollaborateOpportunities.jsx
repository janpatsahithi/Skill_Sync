import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Award, Briefcase, GraduationCap, Trophy } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { collaborateAPI, skillsAPI } from '../services/api'

const opportunityCards = [
  {
    key: 'hackathon',
    title: 'Hackathons',
    description: 'Build fast, ship ideas, and compete in real-world challenges.',
    icon: Trophy,
  },
  {
    key: 'internship',
    title: 'Internships',
    description: 'Find practical roles to gain industry experience.',
    icon: Briefcase,
  },
  {
    key: 'workshop',
    title: 'Workshops',
    description: 'Improve skills through focused hands-on sessions.',
    icon: GraduationCap,
  },
  {
    key: 'competition',
    title: 'Competitions',
    description: 'Test your skills and benchmark against peers.',
    icon: Award,
  },
]

const getSkillLabel = (skill) => {
  if (typeof skill === 'string') return skill
  if (skill && typeof skill === 'object') {
    return skill.label || skill.skill || skill.normalized_key || ''
  }
  return ''
}

const CollaborateOpportunities = () => {
  const [topSkills, setTopSkills] = useState([])
  const [loadingSkills, setLoadingSkills] = useState(true)
  const [openingType, setOpeningType] = useState('')

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setLoadingSkills(true)
        const response = await skillsAPI.getMySkills()
        const rawSkills = Array.isArray(response?.data?.skills) ? response.data.skills : []
        const parsed = rawSkills.map(getSkillLabel).filter(Boolean).slice(0, 2)
        setTopSkills(parsed)
      } catch (error) {
        console.error('Error loading user skills:', error)
        setTopSkills([])
      } finally {
        setLoadingSkills(false)
      }
    }

    loadSkills()
  }, [])

  const hasSkills = useMemo(() => topSkills.length > 0, [topSkills])

  const handleOpenExternal = async (type) => {
    if (!hasSkills) return
    try {
      setOpeningType(type)
      const response = await collaborateAPI.getExternalOpportunities(type)
      const url = response?.data?.redirect_url
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error generating external opportunity link:', error)
    } finally {
      setOpeningType('')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">External Opportunities</h1>
        <p className="text-text-secondary">Explore skill-based hackathons, internships, workshops, and competitions.</p>
      </div>

      {!loadingSkills && !hasSkills ? (
        <Card className="rounded-2xl border-primary/20 bg-white/85">
          <p className="text-text-secondary">Add skills to unlock personalized opportunity recommendations.</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {opportunityCards.map((card) => {
          const Icon = card.icon
          const busy = openingType === card.key
          return (
            <Card key={card.key} className="rounded-2xl border-primary/15 bg-white/90 shadow-sm hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Powered by Unstop
                </span>
              </div>

              <h3 className="text-lg font-semibold text-text-primary">{card.title}</h3>
              <p className="text-sm text-text-secondary mt-2 min-h-[44px]">{card.description}</p>

              <div className="mt-4 flex flex-wrap gap-2 min-h-[34px]">
                {topSkills.map((skill) => (
                  <span
                    key={`${card.key}-${skill}`}
                    className="text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20 text-primary bg-primary/5"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <Button
                className="mt-5 w-full justify-center"
                onClick={() => handleOpenExternal(card.key)}
                disabled={!hasSkills || busy}
              >
                {busy ? 'Opening...' : 'Explore on Unstop'}
                <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default CollaborateOpportunities
