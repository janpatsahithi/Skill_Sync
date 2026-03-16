import { Link } from 'react-router-dom'

const DashboardHeroSection = () => {
  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-100 via-white to-blue-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Welcome Back to SkillSync
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          Continue your skill analysis, improve your gaps, and move faster toward your target role.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/dashboard"
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:scale-105"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/app/analysis/result"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Analyze Skills
          </Link>
        </div>
      </div>
    </section>
  )
}

export default DashboardHeroSection
