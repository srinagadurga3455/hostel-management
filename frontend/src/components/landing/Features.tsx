import { Users, Home, LogOut, MessageSquare, Calendar, UtensilsCrossed } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Manage student records and information efficiently in one place.'
    },
    {
      icon: Home,
      title: 'Room Management',
      description: 'Track room availability, allocations, and occupancy with ease.'
    },
    {
      icon: LogOut,
      title: 'Outing Management',
      description: 'Students can submit outing requests and administrators can approve or reject them.'
    },
    {
      icon: MessageSquare,
      title: 'Complaint Management',
      description: 'Students can submit complaints and administrators can track and manage them.'
    },
    {
      icon: Calendar,
      title: 'Attendance Management',
      description: 'Maintain and monitor student attendance records systematically.'
    },
    {
      icon: UtensilsCrossed,
      title: 'Food Menu',
      description: 'Manage and display daily hostel food menus for all students.'
    }
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            Powerful Features for Modern Hostels
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your hostel efficiently and effectively
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
