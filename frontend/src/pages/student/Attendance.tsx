import { useQuery } from '@tanstack/react-query'
import { attendanceApi } from '../../api/attendance.api'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { getErrorMessage } from '../../api/client'
import { useState, useMemo } from 'react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getStartWeekday(year: number, month: number) {
  // Monday = 0 ... Sunday = 6
  const jsDay = new Date(year, month, 1).getDay() // 0 Sun ..6 Sat
  return (jsDay + 6) % 7
}

export default function StudentAttendance() {
  const { user } = useAuth()
  const sid = user?.student?.id
  const { data, isLoading, error } = useQuery({ queryKey: ['att', sid], queryFn: () => attendanceApi.byStudent(sid!), enabled: !!sid })
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const mapByDate = useMemo(() => {
    const m = new Map<string, string>()
    if (!data) return m
    for (const a of data as any[]) {
      const d = String(a.date).slice(0, 10) // YYYY-MM-DD
      m.set(d, String(a.status).toUpperCase())
    }
    return m
  }, [data])

  const filteredForMonth = useMemo(() => {
    if (!data) return []
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return (data as any[]).filter((a) => String(a.date).startsWith(prefix))
  }, [data, year, month])

  const present = filteredForMonth.filter((a) => String(a.status).toUpperCase() === 'PRESENT').length
  const absent = filteredForMonth.filter((a) => String(a.status).toUpperCase() === 'ABSENT').length
  const total = filteredForMonth.length
  const attRate = total ? Math.round((present / total) * 100) : 0

  // overall stats (for header subtitle)
  const overallPresent = (data as any[])?.filter((a) => String(a.status).toUpperCase() === 'PRESENT').length ?? 0
  const overallTotal = data?.length ?? 0

  if (!sid) return <ErrorState message="No student profile found" />
  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>
  if (error) return <ErrorState message={getErrorMessage(error)} />
  if (!data?.length) return <div><h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance</h1><p className="text-gray-600 text-sm mb-6">Your attendance record for this month.</p><EmptyState title="No attendance records" /></div>

  const daysInMonth = getDaysInMonth(year, month)
  const startOffset = getStartWeekday(year, month)
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayStr = new Date().toISOString().slice(0, 10)

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance</h1>
        <p className="text-gray-600 text-sm">Your attendance record for {monthLabel} · Overall {overallPresent}/{overallTotal} present</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Attendance Rate</p>
          <h2 className="text-4xl font-bold text-gray-900">{attRate}%</h2>
          <p className="text-xs text-gray-400 mt-1">{monthLabel}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Present</p>
          <h2 className="text-4xl font-bold text-green-600">{present} days</h2>
          <p className="text-xs text-gray-400 mt-1">{total ? `${present} of ${total}` : 'No records this month'}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Absent</p>
          <h2 className="text-4xl font-bold text-red-600">{absent} days</h2>
          <p className="text-xs text-gray-400 mt-1">{total ? `${absent} of ${total}` : 'No records this month'}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Marked</p>
          <h2 className="text-4xl font-bold text-blue-600">{total}</h2>
          <p className="text-xs text-gray-400 mt-1">{daysInMonth} days in month</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 text-lg">{monthLabel}</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">‹ Prev</button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Today</button>
            <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Next ›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs font-semibold text-gray-500 py-2">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="h-20 rounded-xl border border-transparent" />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const status = mapByDate.get(dateStr)
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr
            let bg = 'bg-white border-gray-200'
            let icon = null
            let label = ''
            if (status === 'PRESENT') {
              bg = 'bg-green-50 border-green-200'
              icon = <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white text-sm">✓</span>
              label = 'Present'
            } else if (status === 'ABSENT') {
              bg = 'bg-red-50 border-red-200'
              icon = <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-sm">✕</span>
              label = 'Absent'
            } else if (isFuture) {
              bg = 'bg-gray-50 border-gray-100'
              label = 'Future'
            } else {
              bg = 'bg-white border-gray-200'
              label = 'Not marked'
            }
            return (
              <div key={idx} className={`h-20 rounded-xl border p-2 flex flex-col ${bg} ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>
                  {icon}
                </div>
                <span className={`mt-auto text-[10px] uppercase tracking-wide font-medium ${status === 'PRESENT' ? 'text-green-700' : status === 'ABSENT' ? 'text-red-700' : 'text-gray-400'}`}>{label}</span>
              </div>
            )
          })}
        </div>

        <div className="flex gap-4 mt-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</span> Present</span>
          <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">✕</span> Absent</span>
          <span className="flex items-center gap-1.5"><span className="w-6 h-6 rounded-full border border-gray-300 bg-white" /> Not marked</span>
        </div>
      </div>
    </div>
  )
}
