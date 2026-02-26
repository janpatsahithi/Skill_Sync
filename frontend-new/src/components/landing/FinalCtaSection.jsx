import { Link } from 'react-router-dom'

const FinalCtaSection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to Take Control of Your Career?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-blue-100">
          Join SkillSync and make data-driven career decisions.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
        >
          Start Your Journey
        </Link>
      </div>
    </section>
  )
}

export default FinalCtaSection
