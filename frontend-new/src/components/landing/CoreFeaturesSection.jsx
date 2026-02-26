import { BarChart3, Bot, Users, Briefcase } from 'lucide-react'

const features = [
  {
    title: 'Skill Gap Analysis',
    desc: 'Map your current profile against role requirements and identify missing capabilities.',
    icon: BarChart3,
  },
  {
    title: 'AI Career Coach',
    desc: 'Get contextual recommendations for next skills, projects, and role transitions.',
    icon: Bot,
  },
  {
    title: 'Industry Community',
    desc: 'Learn from professionals, company experiences, and role-based guidance threads.',
    icon: Users,
  },
  {
    title: 'Smart Job Insights',
    desc: 'Track market trends and in-demand skills to align your learning with hiring needs.',
    icon: Briefcase,
  },
]

const CoreFeaturesSection = () => {
  return (
    <section id="core-features" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Core Features</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
                  <Icon className="h-5 w-5 text-indigo-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CoreFeaturesSection
