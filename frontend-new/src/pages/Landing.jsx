import Navbar from '../components/Navbar'
import HeroSection from '../components/landing/HeroSection'
import ProblemSolutionSection from '../components/landing/ProblemSolutionSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import CoreFeaturesSection from '../components/landing/CoreFeaturesSection'
import FinalCtaSection from '../components/landing/FinalCtaSection'

const Landing = () => {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      <HeroSection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <FinalCtaSection />
    </div>
  )
}

export default Landing
