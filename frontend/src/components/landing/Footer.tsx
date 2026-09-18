import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">HostelEase</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Smarter hostel management for modern educational institutions. 
              Simplify operations and improve student life.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Navigation</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', href: '#home' },
                { label: 'Features', href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'About', href: '#about' }
              ].map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => {
                      const element = document.getElementById(link.href.substring(1))
                      if (element) {
                        const offset = 80
                        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                        window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
                      }
                    }}
                    className="text-sm hover:text-indigo-400 transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              {[
                'Student Management',
                'Room Allocation',
                'Outing Requests',
                'Complaint Tracking',
                'Attendance System',
                'Food Menu'
              ].map((feature) => (
                <li key={feature} className="text-gray-400">
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Get Started</h4>
            <div className="space-y-3">
              <Link
                to="/register"
                className="block text-sm hover:text-indigo-400 transition-colors"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="block text-sm hover:text-indigo-400 transition-colors"
              >
                Login
              </Link>
              <div className="pt-2">
                <p className="text-sm text-gray-400">Contact</p>
                <p className="text-sm text-gray-500 mt-1">support@hostelease.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} HostelEase. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <button className="hover:text-indigo-400 transition-colors">Privacy Policy</button>
              <button className="hover:text-indigo-400 transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
