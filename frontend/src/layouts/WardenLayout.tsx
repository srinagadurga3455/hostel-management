import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, BedDouble, Users, ClipboardCheck, Utensils, ClipboardList, Plane, Calendar, Menu, X, LogOut, Building, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type LinkItem = { to: string; label: string; icon: any; end?: boolean; desc: string }
const groups: { title: string; links: LinkItem[] }[] = [
  { title: 'Overview', links: [{ to: '/warden', label: 'Dashboard', icon: LayoutDashboard, end: true, desc: 'At a glance' }] },
  { title: 'Residence', links: [
    { to: '/warden/rooms', label: 'Rooms', icon: BedDouble, desc: 'Blocks & occupancy' },
    { to: '/warden/students', label: 'Students', icon: Users, desc: 'Roster & rooms' },
  ]},
  { title: 'Daily ops', links: [
    { to: '/warden/attendance', label: 'Attendance', icon: ClipboardCheck, desc: 'Daily roster' },
    { to: '/warden/food', label: 'Food Menu', icon: Utensils, desc: 'Weekly mess' },
  ]},
  { title: 'Requests', links: [
    { to: '/warden/complaints', label: 'Complaints', icon: ClipboardList, desc: 'Inbox' },
    { to: '/warden/outings', label: 'Outings', icon: Plane, desc: 'Day out' },
    { to: '/warden/leaves', label: 'Leaves', icon: Calendar, desc: 'Multi-day' },
  ]},
]

export default function WardenLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Building size={18}/></div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold tracking-tight text-slate-900">HostelOS</p>
            <p className="text-[11px] font-medium tracking-widest text-slate-500 uppercase flex items-center gap-1"><Shield size={10}/> Warden</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto px-3 py-4 space-y-6">
        {groups.map(g=> (
          <div key={g.title}>
            <p className="px-2 mb-2 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">{g.title}</p>
            <div className="space-y-1">
              {g.links.map(l=> (
                <NavLink key={l.to} to={l.to} end={l.end} onClick={()=> setOpen(false)}
                  className={({isActive})=> `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive? 'bg-slate-900 text-white shadow-sm':'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200'}`}>
                  <l.icon size={16} className="shrink-0 opacity-80"/>
                  <span className="flex-1 text-[13px] font-medium tracking-tight leading-none">{l.label}</span>
                  <span className={`hidden group-hover:inline text-[11px] ${/* keep desc subtle */''}`}></span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">{(user?.name ?? '?').slice(0,2).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-slate-900 leading-none">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <LogOut size={14}/> Sign out
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-400">Minimal • Secure • Fast</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-[260px] shrink-0 lg:block sticky top-0 h-screen overflow-hidden"><Sidebar/></aside>
      {open && <div className="fixed inset-0 z-40 flex lg:hidden"><div className="w-[280px] bg-white shadow-xl"><Sidebar/></div><div className="flex-1 bg-slate-900/20 backdrop-blur-sm" onClick={()=> setOpen(false)}/></div>}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/80 backdrop-blur px-4 py-3 lg:px-6">
          <button className="lg:hidden rounded-xl border border-slate-200 bg-white p-2" onClick={()=> setOpen(!open)}>{open? <X size={16}/>:<Menu size={16}/>}</button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/> Live • Warden console
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-500">{new Date().toLocaleDateString('en-IN',{weekday:'short', day:'2-digit', month:'short'})}</span>
            <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">{(user?.name ?? '?').slice(0,1).toUpperCase()}</div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto"><Outlet/></main>
      </div>
    </div>
  )
}
