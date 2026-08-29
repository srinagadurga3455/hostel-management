import { useQuery } from '@tanstack/react-query'
import { roomsApi } from '../../api/rooms.api'
import { studentsApi } from '../../api/students.api'
import { complaintsApi } from '../../api/complaints.api'
import { outingsApi } from '../../api/outings.api'
import { leavesApi } from '../../api/leaves.api'
import { attendanceApi } from '../../api/attendance.api'
import { foodApi } from '../../api/food.api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { getErrorMessage } from '../../api/client'
import { Link } from 'react-router-dom'
import { BedDouble, Users, ClipboardCheck, Utensils, ClipboardList, Plane, Calendar, ArrowUpRight, Clock, AlertTriangle, CheckCircle2, Building2, Layers } from 'lucide-react'

function todayStr(){ return new Date().toISOString().slice(0,10) }
function fmtDate(d:Date){ return d.toLocaleDateString('en-IN',{weekday:'long', day:'2-digit', month:'long'}) }

export default function WardenDashboard() {
  const qRooms = useQuery({ queryKey: ['rooms'], queryFn: roomsApi.list })
  const qStudents = useQuery({ queryKey: ['students'], queryFn: studentsApi.list })
  const qComplaints = useQuery({ queryKey: ['complaints'], queryFn: complaintsApi.list })
  const qOutings = useQuery({ queryKey: ['outings'], queryFn: outingsApi.list })
  const qLeaves = useQuery({ queryKey: ['leaves'], queryFn: leavesApi.list })
  const qAtt = useQuery({ queryKey: ['attendance'], queryFn: attendanceApi.list })
  const qFood = useQuery({ queryKey: ['food'], queryFn: foodApi.list })

  const loading = [qRooms,qStudents,qComplaints,qOutings,qLeaves,qAtt].some(q=> q.isLoading)
  if(loading) return <div className="flex justify-center p-8"><Spinner/></div>
  const err = qRooms.error || qStudents.error || qComplaints.error
  if(err) return <ErrorState message={getErrorMessage(err)}/>

  const occupancy = qRooms.data?.reduce((s,r)=> s + (r.occupied ?? 0),0) ?? 0
  const capacity = qRooms.data?.reduce((s,r)=> s + (r.capacity ?? 0),0) ?? 0
  const rate = capacity? Math.round(occupancy/capacity*100):0
  const vacant = Math.max(0, capacity - occupancy)
  const totalRooms = qRooms.data?.length ?? 0
  const totalStudents = qStudents.data?.length ?? 0
  const unassigned = qStudents.data?.filter(s=> !s.roomId).length ?? 0

  const pendingComplaints = qComplaints.data?.filter(c=> (c.status??'').toString().toUpperCase()==='PENDING').length ?? 0
  const inprogComplaints = qComplaints.data?.filter(c=> (c.status??'').toString().toUpperCase()==='IN_PROGRESS').length ?? 0
  const pendingOutings = qOutings.data?.filter(o=> (o.status??'').toString().toUpperCase()==='PENDING').length ?? 0
  const pendingLeaves = qLeaves.data?.filter(l=> (l.status??'').toString().toUpperCase()==='PENDING').length ?? 0
  const pendingTotal = pendingComplaints + pendingOutings + pendingLeaves

  const today = todayStr()
  const todayAtt = qAtt.data?.filter(a=> (a.date??'').toString().slice(0,10)===today) ?? []
  const presentToday = todayAtt.filter(a=> (a.status??'').toString().toUpperCase()==='PRESENT').length
  const absentToday = todayAtt.filter(a=> (a.status??'').toString().toUpperCase()==='ABSENT').length
  const attRate = totalStudents? Math.round(presentToday/totalStudents*100):0

  const foodCoverage = qFood.data?.length ?? 0
  const blocks = Array.from(new Set((qRooms.data ?? []).map(r=> r.block))).sort()
  const blockStats = blocks.map(b=>{
    const rs=(qRooms.data ?? []).filter(r=> r.block===b)
    const cap=rs.reduce((s,r)=> s+r.capacity,0)
    const occ=rs.reduce((s,r)=> s+r.occupied,0)
    return {block:b, rooms:rs.length, cap, occ, rate: cap? Math.round(occ/cap*100):0}
  })

  const recentComplaints = [...(qComplaints.data ?? [])].sort((a:any,b:any)=> String(b.createdAt??b.created_at??'').localeCompare(String(a.createdAt??a.created_at??''))).slice(0,3)
  const recentOutings = [...(qOutings.data ?? [])].sort((a:any,b:any)=> String(b.outingDate??b.outing_date??'').localeCompare(String(a.outingDate??a.outing_date??''))).slice(0,3)
  const recentLeaves = [...(qLeaves.data ?? [])].sort((a:any,b:any)=> String(b.startDate??b.start_date??'').localeCompare(String(a.startDate??a.start_date??''))).slice(0,3)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Good morning, {qRooms.isSuccess? 'Warden':''}</h1>
          <p className="text-sm text-slate-500 mt-1">{fmtDate(new Date())} • {totalStudents} students • {totalRooms} rooms</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"><Clock size={12}/> Today {today}</span>
          {pendingTotal>0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1.5 text-xs font-medium"><AlertTriangle size={12}/>{pendingTotal} pending</span>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-slate-500 uppercase">Occupancy</p>
            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"><BedDouble size={14} className="text-slate-600"/></div>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{occupancy}<span className="text-sm font-medium text-slate-500">/{capacity}</span></p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{width:`${rate}%`}}/></div>
          <p className="mt-2 flex items-center justify-between text-xs"><span className="text-slate-500">{rate}% filled</span><span className="font-medium text-slate-700">{vacant} vacant</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-slate-500 uppercase">Students</p>
            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"><Users size={14} className="text-slate-600"/></div>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{totalStudents}</p>
          <p className="mt-1 text-xs text-slate-500">{unassigned? `${unassigned} unassigned`:`All assigned`} • {blocks.length} blocks</p>
          <Link to="/warden/students" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900">View roster <ArrowUpRight size={12}/></Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-slate-500 uppercase">Attendance today</p>
            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"><ClipboardCheck size={14} className="text-slate-600"/></div>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{presentToday}<span className="text-sm font-medium text-slate-500">/{totalStudents}</span></p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{width:`${attRate}%`}}/></div>
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>{presentToday} present</span><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500"/>{absentToday} absent</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-widest text-slate-500 uppercase">Pending queue</p>
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center"><AlertTriangle size={14}/></div>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{pendingTotal}</p>
          <p className="mt-1 text-xs text-slate-500">{pendingComplaints} complaints • {pendingOutings} outings • {pendingLeaves} leaves</p>
          <div className="mt-3 flex gap-1.5">
            <Link to="/warden/complaints" className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50">Complaints</Link>
            <Link to="/warden/outings" className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50">Outings</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Blocks */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2"><Building2 size={16} className="text-slate-500"/> Blocks occupancy</h3>
            <Link to="/warden/rooms" className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">Manage <ArrowUpRight size={12}/></Link>
          </div>
          {!blockStats.length? <p className="text-sm text-slate-500 mt-4">No rooms yet</p> :
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {blockStats.map(b=> (
                <div key={b.block} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest text-slate-600">BLOCK {b.block}</span>
                    <span className="text-xs text-slate-500">{b.occ}/{b.cap}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white border border-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{width:`${b.rate}%`}}/></div>
                  <p className="mt-1.5 flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><Layers size={12}/>{b.rooms} rooms</span><span className="font-medium text-slate-700">{b.rate}%</span></p>
                </div>
              ))}
            </div>
          }
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">Food coverage</span>
            <span className="text-xs font-medium">{foodCoverage}/7 days {foodCoverage===7? <span className="inline-flex items-center gap-1 ml-1"><CheckCircle2 size={12} className="text-emerald-600"/> full</span>: <span className="text-amber-600">{7-foodCoverage} missing</span>}</span>
          </div>
        </div>

        {/* Today attendance mini + quick links */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">Today&apos;s attendance</h3>
            <div className="mt-3 space-y-2 max-h-[160px] overflow-auto pr-1">
              {todayAtt.length? todayAtt.slice(0,6).map(a=> (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-mono text-slate-600">#{a.studentId}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full bg-white border px-2 py-0.5 text-[11px] font-medium ${a.status==='PRESENT'? 'border-slate-200 text-slate-700':'border-slate-200 text-slate-600'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${a.status==='PRESENT'? 'bg-emerald-500':'bg-red-500'}`}/>{a.status}
                  </span>
                </div>
              )) : <p className="text-xs text-slate-500">No marks yet for today</p>}
            </div>
            <Link to="/warden/attendance" className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">Take attendance <ArrowUpRight size={12}/></Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">Quick actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/warden/rooms" className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white p-3 flex flex-col gap-1"><BedDouble size={16} className="text-slate-600"/><span className="text-xs font-medium">Rooms</span><span className="text-[11px] text-slate-500">{vacant} vacant</span></Link>
              <Link to="/warden/food" className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white p-3 flex flex-col gap-1"><Utensils size={16} className="text-slate-600"/><span className="text-xs font-medium">Food</span><span className="text-[11px] text-slate-500">{foodCoverage}/7</span></Link>
              <Link to="/warden/complaints" className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white p-3 flex flex-col gap-1"><ClipboardList size={16} className="text-slate-600"/><span className="text-xs font-medium">Complaints</span><span className="text-[11px] text-slate-500">{pendingComplaints} pending</span></Link>
              <Link to="/warden/leaves" className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white p-3 flex flex-col gap-1"><Calendar size={16} className="text-slate-600"/><span className="text-xs font-medium">Leaves</span><span className="text-[11px] text-slate-500">{pendingLeaves} pending</span></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Queues */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold tracking-tight">Complaints</h3><span className="rounded-full bg-slate-900 text-white px-2 py-0.5 text-xs font-medium">{pendingComplaints+inprogComplaints} active</span></div>
          <div className="mt-3 space-y-2">
            {recentComplaints.length? recentComplaints.map((c:any)=> (
              <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium truncate">{c.title}</p>
                <p className="text-xs text-slate-500 truncate">{c.description}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${c.status==='PENDING'? 'bg-amber-500': c.status==='IN_PROGRESS'? 'bg-indigo-500': c.status==='RESOLVED'? 'bg-emerald-500':'bg-red-500'}`}/>{c.status}</p>
              </div>
            )): <p className="text-xs text-slate-500">No complaints</p>}
          </div>
          <Link to="/warden/complaints" className="mt-3 inline-flex text-xs font-medium text-slate-600 hover:text-slate-900 gap-1">Open queue <ArrowUpRight size={12}/></Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold tracking-tight">Outings</h3><span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium">{pendingOutings} pending</span></div>
          <div className="mt-3 space-y-2">
            {recentOutings.length? recentOutings.map((o:any)=> (
              <div key={o.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium truncate flex items-center gap-1"><Plane size={12}/>{o.destination ?? o.destination}</p>
                <p className="text-xs text-slate-500">{String(o.outingDate??o.outing_date??'').slice(0,10)} • {o.outTime??o.out_time}→{o.inTime??o.in_time}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${o.status==='PENDING'? 'bg-amber-500': o.status==='APPROVED'? 'bg-emerald-500':'bg-red-500'}`}/>{o.status}</p>
              </div>
            )): <p className="text-xs text-slate-500">No outings</p>}
          </div>
          <Link to="/warden/outings" className="mt-3 inline-flex text-xs font-medium text-slate-600 hover:text-slate-900 gap-1">Review <ArrowUpRight size={12}/></Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold tracking-tight">Leaves</h3><span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium">{pendingLeaves} pending</span></div>
          <div className="mt-3 space-y-2">
            {recentLeaves.length? recentLeaves.map((l:any)=> (
              <div key={l.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium">{String(l.startDate??l.start_date??'').slice(0,10)} → {String(l.endDate??l.end_date??'').slice(0,10)}</p>
                <p className="text-xs text-slate-500 truncate">{l.reason}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${l.status==='PENDING'? 'bg-amber-500': l.status==='APPROVED'? 'bg-emerald-500':'bg-red-500'}`}/>{l.status}</p>
              </div>
            )): <p className="text-xs text-slate-500">No leaves</p>}
          </div>
          <Link to="/warden/leaves" className="mt-3 inline-flex text-xs font-medium text-slate-600 hover:text-slate-900 gap-1">Review <ArrowUpRight size={12}/></Link>
        </div>
      </div>
    </div>
  )
}
