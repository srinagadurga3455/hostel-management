import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Home, DoorOpen, Calendar, LogOut, ChevronRight, AlertCircle, Utensils, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/student', label: 'Home', icon: Home },
]

const hostelItems = [
  { to: '/student/room', label: 'My Room', icon: DoorOpen },
  { to: '/student/attendance', label: 'Attendance', icon: Calendar },
  { to: '/student/outings', label: 'Outings', icon: ChevronRight },
  { to: '/student/leaves', label: 'Leaves', icon: ClipboardList },
  { to: '/student/complaints', label: 'Complaints', icon: AlertCircle },
  { to: '/student/food', label: 'Food / Mess', icon: Utensils },
]


export default function StudentLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  
  const Sidebar = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">H</div>
        <span className="text-lg font-semibold text-gray-900">HostelOS</span>
      </div>
      
      <nav className="flex-1 px-3 py-2 space-y-6">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/student'} onClick={() => setOpen(false)} 
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
              }`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">MY HOSTEL</div>
          <div className="space-y-1">
            {hostelItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">Student</p>
          </div>
        </div>
        <button onClick={logout} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors">
          <LogOut size={16}/> 
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 bg-white shadow-2xl"><Sidebar /></div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setOpen(!open)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
      </div>
    </div>
  )
}
