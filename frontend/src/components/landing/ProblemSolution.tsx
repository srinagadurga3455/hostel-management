import { FileText, TrendingUp, Zap } from 'lucide-react'

export default function ProblemSolution() {
  const features = [
    {
      icon: FileText,
      title: 'Less Manual Work',
      description: 'Eliminate paper-based processes and reduce administrative burden with digital workflows.'
    },
    {
      icon: TrendingUp,
      title: 'Better Organization',
      description: 'Keep all hostel data organized and accessible in one centralized platform.'
    },
    {
      icon: Zap,
      title: 'Faster Communication',
      description: 'Streamline communication between students and administrators for quick resolutions.'
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            Everything Your Hostel Needs, In One Place
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            HostelEase helps reduce manual paperwork, improve communication, 
            simplify administration, and make hostel-related activities easier 
            for students and administrators.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300"
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
