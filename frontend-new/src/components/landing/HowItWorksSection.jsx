import { Upload, Radar, Compass } from 'lucide-react'

const steps = [
  {
    title: 'Upload Your Resume',
    text: 'We extract and normalize your skills.',
    icon: Upload,
  },
  {
    title: 'Analyze Skill Gap',
    text: 'Compare with real industry standards.',
    icon: Radar,
  },
  {
    title: 'Grow with Guidance',
    text: 'Get personalized roadmap and community insights.',
    icon: Compass,
  },
]

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
                  <Icon className="h-6 w-6 text-indigo-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-slate-600">{step.text}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
