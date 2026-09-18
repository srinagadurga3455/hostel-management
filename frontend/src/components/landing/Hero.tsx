import { Link } from 'react-router-dom'
import { Users, Home, ClipboardList, MessageSquare, TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Smarter Hostel Management.{' '}
                <span className="text-indigo-600">Simpler Student Life.</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Manage rooms, outings, complaints, attendance, and daily hostel operations 
                in one simple digital platform.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl text-center font-semibold"
              >
                Get Started
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
                className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg hover:bg-indigo-50 transition-colors text-center font-semibold"
              >
                Explore Features
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Dashboard Overview</h3>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-xl p-6 space-y-2">
                  <Users className="text-indigo-600" size={32} />
                  <p className="text-3xl font-bold text-gray-900">248</p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6 space-y-2">
                  <Home className="text-blue-600" size={32} />
                  <p className="text-3xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-gray-600">Available Rooms</p>
                </div>
                
                <div className="bg-amber-50 rounded-xl p-6 space-y-2">
                  <ClipboardList className="text-amber-600" size={32} />
                  <p className="text-3xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-600">Pending Outings</p>
                </div>
                
                <div className="bg-rose-50 rounded-xl p-6 space-y-2">
                  <MessageSquare className="text-rose-600" size={32} />
                  <p className="text-3xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-600">Open Complaints</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Attendance Overview</p>
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Present Today</span>
                    <span className="font-semibold text-gray-900">234 / 248</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
