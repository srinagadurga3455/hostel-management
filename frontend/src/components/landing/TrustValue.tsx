import { Boxes, Sparkles, Database } from 'lucide-react'

export default function TrustValue() {
  const values = [
    {
      icon: Boxes,
      title: 'Organized Hostel Operations',
      description: 'Centralize all hostel management tasks in one intuitive platform for seamless operations.'
    },
    {
      icon: Sparkles,
      title: 'Improved Student Experience',
      description: 'Make hostel life easier with quick access to services and transparent communication.'
    },
    {
      icon: Database,
      title: 'Centralized Management',
      description: 'Keep all data secure and accessible from anywhere with cloud-based infrastructure.'
    }
  ]

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            Built to Make Hostel Life Easier
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Designed with both students and administrators in mind
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center mb-6">
                <value.icon className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
