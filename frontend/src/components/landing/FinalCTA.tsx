import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-blue-700">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white">
            Ready to Simplify Hostel Management?
          </h2>
          <p className="text-xl text-indigo-100">
            Bring your hostel operations together with one simple digital platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register"
            className="group bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
          <button
            onClick={() => {
              const element = document.getElementById('features')
              if (element) {
                const offset = 80
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
              }
            }}
            className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors font-semibold"
          >
            Explore Features
          </button>
        </div>
      </div>
    </section>
  )
}
