import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, Target, AlertCircle, Sparkles, BrainCircuit } from 'lucide-react'

const HeroSection = () => {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#071b3a] via-[#123a82] to-[#2b6cb0]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-pink-500/30 blur-3xl" />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-pink-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-pink-300" />
            SkillSync
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-blue-100 via-white to-fuchsia-100 bg-clip-text text-transparent">
              AI-Powered Career Intelligence
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-indigo-100/85 sm:text-lg">
            Discover your skill gaps, explore real industry insights, and get personalized guidance to land your dream role.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{ backgroundImage: 'linear-gradient(120deg, #ec4899, #3b82f6)', backgroundSize: '200% 200%' }}
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#core-features"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/5 px-7 py-3.5 text-sm font-semibold text-indigo-100 backdrop-blur transition hover:bg-white/10"
            >
              Explore Features
            </a>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/25 bg-white/10 p-6 shadow-2xl shadow-indigo-900/40 backdrop-blur-xl sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-indigo-100">Career Snapshot</h3>
            <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/20 px-2.5 py-1 text-xs font-semibold text-fuchsia-100">
              AI Live
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-indigo-100">Skill Gap Score</span>
                <span className="font-bold text-white">62%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/15">
                <div
                  className="h-2.5 w-[62%] rounded-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all duration-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-indigo-200">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-300" />
                  Missing Skills
                </p>
                <p className="mt-1.5 text-sm font-medium text-white">SQL, Statistics</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-indigo-200">
                  <Target className="h-3.5 w-3.5 text-blue-300" />
                  Target Role
                </p>
                <p className="mt-1.5 text-sm font-medium text-white">Data Scientist</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200/20 bg-emerald-400/10 p-3.5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-emerald-100">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                Trending Skill
              </p>
              <p className="mt-1.5 text-sm font-semibold text-emerald-100">Python +12%</p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-blue-500/20 to-pink-500/20 p-3.5">
              <p className="text-xs uppercase tracking-[0.08em] text-indigo-100">Priority Step</p>
              <p className="mt-1.5 text-sm text-white">
                Complete SQL fundamentals and build one statistics project this week.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
