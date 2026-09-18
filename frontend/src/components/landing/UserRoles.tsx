import { GraduationCap, Shield } from 'lucide-react'

export default function UserRoles() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">
            Built for Students and Administrators
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tailored features for different user roles
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <GraduationCap className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Students</h3>
            </div>
            
            <ul className="space-y-4">
              {[
                'Submit outing requests',
                'Raise complaints',
                'View food menus',
                'Access hostel-related information',
                'Check attendance records',
                'View room details'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Shield className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Administrators</h3>
            </div>
            
            <ul className="space-y-4">
              {[
                'Manage students and rooms',
                'Approve outing requests',
                'Handle complaints',
                'Manage attendance and food menus',
                'View analytics and reports',
                'Monitor hostel operations'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
