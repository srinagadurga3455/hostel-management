import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
    }
    setIsOpen(false)
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button onClick={() => scrollToSection('home')} className="text-2xl font-bold text-indigo-600">
              HostelEase
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-indigo-600 transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-indigo-600 transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 hover:text-indigo-600 transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-indigo-600 transition-colors">
              About
            </button>
            <Link 
              to="/login" 
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-indigo-600"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <button
              onClick={() => scrollToSection('home')}
              className="block w-full text-left text-gray-700 hover:text-indigo-600 py-2"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-gray-700 hover:text-indigo-600 py-2"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left text-gray-700 hover:text-indigo-600 py-2"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left text-gray-700 hover:text-indigo-600 py-2"
            >
              About
            </button>
            <Link
              to="/login"
              className="block text-indigo-600 font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-center"
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
