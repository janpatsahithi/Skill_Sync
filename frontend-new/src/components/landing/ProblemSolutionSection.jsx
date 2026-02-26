import { AlertCircle, HelpCircle, Route, Sparkles, BarChart3, BookOpenCheck, Lightbulb } from 'lucide-react'

const ProblemSolutionSection = () => {
  const problems = [
    { icon: HelpCircle, text: "Not sure which skills to learn?" },
    { icon: AlertCircle, text: "Unsure if you're job-ready?" },
    { icon: Route, text: "No clear roadmap to switch roles?" },
  ]

  const solutions = [
    { icon: Sparkles, text: 'AI-powered skill gap analysis' },
    { icon: BarChart3, text: 'Real industry-based insights' },
    { icon: BookOpenCheck, text: 'Personalized learning path' },
    { icon: Lightbulb, text: 'Smart career recommendations' },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Confused About Your Career Direction?</h2>
          <ul className="mt-6 space-y-4">
            {problems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.text} className="flex items-start gap-3 text-slate-700">
                  <Icon className="mt-0.5 h-5 w-5 text-rose-500" />
                  <span>{item.text}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">SkillSync Gives You Clarity</h2>
          <ul className="mt-6 space-y-4">
            {solutions.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.text} className="flex items-start gap-3 text-slate-700">
                  <Icon className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <span>{item.text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ProblemSolutionSection
