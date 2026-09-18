import { UserPlus, LayoutDashboard, CheckCircle } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: 'Register and Login',
      description: 'Users securely access the platform with role-based authentication.'
    },
    {
      icon: LayoutDashboard,
      title: 'Manage Hostel Activities',
      description: 'Students and administrators use relevant features based on their roles.'
    },
    {
      icon: CheckCircle,
      title: 'Stay Organized',
      description: 'Hostel operations become easier to manage digitally and efficiently.'
    }
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            Simple. Organized. Efficient.
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with HostelEase in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <step.icon className="text-white" size={36} />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-lg">{index + 1}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-indigo-300 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
