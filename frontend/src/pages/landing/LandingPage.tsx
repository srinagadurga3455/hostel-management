import Navbar from '../../components/landing/Navbar'
import Hero from '../../components/landing/Hero'
import ProblemSolution from '../../components/landing/ProblemSolution'
import Features from '../../components/landing/Features'
import HowItWorks from '../../components/landing/HowItWorks'
import UserRoles from '../../components/landing/UserRoles'
import DashboardPreview from '../../components/landing/DashboardPreview'
import TrustValue from '../../components/landing/TrustValue'
import FinalCTA from '../../components/landing/FinalCTA'
import Footer from '../../components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <UserRoles />
      <DashboardPreview />
      <TrustValue />
      <FinalCTA />
      <Footer />
    </div>
  )
}
