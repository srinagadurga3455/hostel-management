import { BarChart3, Users, Home, ClipboardList, MessageSquare, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardPreview() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            A Dashboard That Actually Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional, intuitive, and designed for real hostel management
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 lg:p-12 shadow-2xl border border-gray-200">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm font-medium text-gray-600">HostelEase Dashboard</span>
              <div className="w-20"></div>
            </div>

            <div className="grid lg:grid-cols-4 gap-0">
              <div className="bg-gray-900 text-white p-6 space-y-2 border-r border-gray-700">
                <div className="font-bold text-lg mb-6">Navigation</div>
                {[
                  { icon: BarChart3, label: 'Dashboard' },
                  { icon: Users, label: 'Students' },
                  { icon: Home, label: 'Rooms' },
                  { icon: ClipboardList, label: 'Outings' },
                  { icon: MessageSquare, label: 'Complaints' },
                  { icon: Calendar, label: 'Attendance' }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0 ? 'bg-indigo-600' : 'hover:bg-gray-800'
                    } transition-colors cursor-pointer`}
                  >
                    <item.icon size={20} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-3 p-8 space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h3>
                  <p className="text-gray-600">Welcome back, Administrator</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-indigo-50 rounded-xl p-6 space-y-2">
                    <Users className="text-indigo-600" size={24} />
                    <p className="text-3xl font-bold text-gray-900">248</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-6 space-y-2">
                    <Home className="text-blue-600" size={24} />
                    <p className="text-3xl font-bold text-gray-900">12</p>
                    <p className="text-sm text-gray-600">Available Rooms</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-6 space-y-2">
                    <ClipboardList className="text-amber-600" size={24} />
                    <p className="text-3xl font-bold text-gray-900">8</p>
                    <p className="text-sm text-gray-600">Pending Requests</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-6 space-y-2">
                    <MessageSquare className="text-rose-600" size={24} />
                    <p className="text-3xl font-bold text-gray-900">3</p>
                    <p className="text-sm text-gray-600">Open Complaints</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900">Attendance Summary</h4>
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Present Today</span>
                      <span className="font-semibold text-gray-900">234 / 248 (94%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Recent Activity</h4>
                  <div className="space-y-3">
                    {[
                      { text: 'New outing request from John Doe', time: '5 min ago' },
                      { text: 'Complaint resolved: Room 204', time: '23 min ago' },
                      { text: 'Room 312 marked as occupied', time: '1 hour ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{activity.text}</span>
                        <span className="text-gray-500">{activity.time}</span>
                      </div>
                    ))}
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
