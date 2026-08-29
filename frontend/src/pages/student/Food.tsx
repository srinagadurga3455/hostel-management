import { useQuery } from '@tanstack/react-query'
import { foodApi } from '../../api/food.api'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { getErrorMessage } from '../../api/client'

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

function getTodayDayName(): string {
  const jsDay = new Date().getDay() // 0 Sun - 6 Sat
  const map: Record<number, string> = {
    0: 'SUNDAY',
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
  }
  return map[jsDay]
}

export default function StudentFood() {
  const { data, isLoading, error } = useQuery({ queryKey: ['food'], queryFn: foodApi.list })

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>
  if (error) return <ErrorState message={getErrorMessage(error)} />
  if (!data?.length) return <div><h1 className="text-2xl font-bold text-gray-900 mb-2">Food Menu</h1><EmptyState title="No menu available" /></div>

  const sorted = [...data].sort((a: any, b: any) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
  const todayName = getTodayDayName()
  const today = sorted.find((m: any) => m.day === todayName) ?? sorted[0]
  const todayLabel = today.day.charAt(0) + today.day.slice(1).toLowerCase()
  const mealIcons = { breakfast: '🥞', lunch: '🍛', snacks: '🍪', dinner: '🍝' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Food Menu</h1>
        <p className="text-gray-600 text-sm">Weekly mess menu schedule.</p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Today's Menu - {todayLabel}</h2>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {Object.entries(mealIcons).map(([meal, icon]) => (
            <div key={meal} className="text-center">
              <div className="text-5xl mb-3">{icon}</div>
              <p className="text-xs uppercase tracking-wider text-blue-100 mb-2">{meal}</p>
              <p className="font-medium">{(today as any)[meal] || 'Not set'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Weekly Schedule</h3>
          <button className="text-blue-600 text-sm font-medium hover:underline">Download menu</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Day</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Breakfast</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lunch</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Snacks</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dinner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sorted.map((m: any) => {
                const isToday = m.day === todayName
                return (
                  <tr key={m.id} className={isToday ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {m.day.charAt(0) + m.day.slice(1).toLowerCase()}
                      {isToday && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Today</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.breakfast}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.lunch}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.snacks}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.dinner}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
