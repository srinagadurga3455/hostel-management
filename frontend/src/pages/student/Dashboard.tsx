import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useMemo } from 'react'
import { foodApi } from '../../api/food.api'
import { complaintsApi } from '../../api/complaints.api'
import { outingsApi } from '../../api/outings.api'
import { useAuth } from '../../context/AuthContext'
import { attendanceApi } from '../../api/attendance.api'
import { studentsApi } from '../../api/students.api'
import { agentApi } from '../../api/agent.api'
import { Spinner } from '../../components/ui/Spinner'
import { getErrorMessage } from '../../api/client'
import { ErrorState } from '../../components/ui/ErrorState'
import { MessageSquareText, ArrowRight, Utensils, CalendarCheck, ChevronRight, DoorOpen, Sparkles, Send, ClipboardList } from 'lucide-react'

type Msg = { role: 'user' | 'assistant'; content: string }
function newSessionId() {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const DAY_ORDER = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
function getTodayName() {
  const m: Record<number,string> = {0:'SUNDAY',1:'MONDAY',2:'TUESDAY',3:'WEDNESDAY',4:'THURSDAY',5:'FRIDAY',6:'SATURDAY'}
  return m[new Date().getDay()]
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const sid = user?.student?.id
  const qc = useQueryClient()

  const qFood = useQuery({ queryKey: ['food'], queryFn: foodApi.list })
  const qComplaints = useQuery({ queryKey: ['complaints'], queryFn: complaintsApi.list })
  const qOutings = useQuery({ queryKey: ['outings'], queryFn: outingsApi.list })
  const qAtt = useQuery({ queryKey: ['att', sid], queryFn: () => attendanceApi.byStudent(sid!), enabled: !!sid })
  const qStudent = useQuery({ queryKey: ['student', sid], queryFn: () => studentsApi.get(sid!), enabled: !!sid })

  // AI state (merged from Agent page)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errAi, setErrAi] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const sessionIdRef = useRef<string>(newSessionId())

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const sidSess = sessionIdRef.current
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setErrAi('')
    try {
      const res = await agentApi.chat({ message: text, session_id: sidSess })
      if (res.session_id) sessionIdRef.current = res.session_id
      setMessages((m) => [...m, { role: 'assistant', content: res.message }])
      setPendingConfirm(!!res.requires_confirmation)
      if (res.success && (res as any).tool_used) {
        const tool = (res as any).tool_used
        if (tool.includes('outing')) qc.invalidateQueries({ queryKey: ['outings'] })
        if (tool.includes('leave')) qc.invalidateQueries({ queryKey: ['leaves'] })
        if (tool.includes('complaint')) qc.invalidateQueries({ queryKey: ['complaints'] })
      }
      if (!res.requires_confirmation) setPendingConfirm(false)
    } catch (e) {
      setErrAi(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // today menu correctly (not data[0]) — hooks must stay before early returns
  const sortedFood = useMemo(() => {
    const d = (qFood.data ?? []) as any[]
    return [...d].sort((a,b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
  }, [qFood.data])
  const todayMenu = useMemo(() => {
    const name = getTodayName()
    return sortedFood.find((m:any) => m.day === name) ?? sortedFood[0]
  }, [sortedFood])

  const isLoading = qFood.isLoading || qComplaints.isLoading || qOutings.isLoading
  const err = qFood.error || qComplaints.error || qOutings.error

  const pendingComplaints = (qComplaints.data ?? []).filter((c) => c.status === 'PENDING')
  const inProgress = (qComplaints.data ?? []).filter((c) => c.status === 'IN_PROGRESS')
  const approvedOutings = (qOutings.data ?? []).filter((o) => String((o as any).status).toUpperCase() === 'APPROVED')
  const attData = qAtt.data ?? []
  const present = attData.filter((a) => String(a.status).toUpperCase() === 'PRESENT').length
  const absent = attData.length - present
  const attRate = attData.length ? Math.round((present / attData.length) * 100) : 0

  const room: any = (qStudent.data as any)?.room
  const roomNumber = room?.roomNumber ?? room?.room_number
  const Chips = ['Create a complaint for water issue','Request outing for tomorrow','What is today dinner?','Show my attendance']

  if (err) return <ErrorState message={getErrorMessage(err)} />

  return (
    <div className="space-y-5">
      {/* minimal header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Good morning, {user?.name?.split(' ')[0]} <span className="font-normal">👋</span></h1>
          <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long'})} · {user?.email}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-gray-700"><DoorOpen size={14}/>{roomNumber ? `${roomNumber} · Block ${room.block}` : 'No room'}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-gray-700"><CalendarCheck size={14}/>{attRate}% present</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* left column */}
        <div className="xl:col-span-2 space-y-5">
          {/* AI Assistant - merged minimal */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center"><Sparkles size={16}/></span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Ask HostelOS</h2>
                  <p className="text-xs text-gray-500">AI assistant for complaints, outings, leaves</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{pendingConfirm ? 'confirmation needed' : 'ready'}</span>
            </div>

            <div className="px-5 pt-4 flex flex-wrap gap-2">
              {Chips.map(c=>(
                <button key={c} onClick={()=>sendMessage(c)} className="text-xs rounded-full border px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 transition">{c}</button>
              ))}
            </div>

            <div className="px-5 py-4">
              <div className="h-[280px] overflow-auto rounded-xl border bg-gray-50 p-3 space-y-2">
                {messages.length===0 && <p className="text-sm text-gray-400 py-10 text-center">Try asking “What is today’s dinner?” or “Create a complaint”.</p>}
                {messages.map((m,i)=>(
                  <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${m.role==='user' ? 'ml-auto bg-gray-900 text-white' : 'mr-auto bg-white border text-gray-800'}`}>{m.content}</div>
                ))}
                {loading && <p className="text-xs text-gray-400">Thinking…</p>}
                {errAi && <p className="text-xs text-red-600">{errAi}</p>}
              </div>

              {pendingConfirm && !loading && (
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>sendMessage('Yes')} className="flex-1 rounded-lg bg-gray-900 text-white py-2 text-sm font-medium hover:bg-black">Confirm</button>
                  <button onClick={()=>sendMessage('No')} className="flex-1 rounded-lg border bg-white py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && sendMessage(input)} placeholder="Type a message…" className="flex-1 rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-gray-300" disabled={loading} />
                <button onClick={()=>sendMessage(input)} disabled={loading || !input.trim()} className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center disabled:opacity-40 hover:bg-black transition"><Send size={16}/></button>
              </div>
            </div>
          </div>

          {/* quick actions minimal */}
           <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: MessageSquareText, label: 'Complaint', href:'/student/complaints' },
              { icon: ArrowRight, label: 'Outing', href:'/student/outings' },
              { icon: ClipboardList, label: 'Leaves', href:'/student/leaves' },
              { icon: Utensils, label: 'Mess', href:'/student/food' },
              { icon: CalendarCheck, label: 'Attendance', href:'/student/attendance' },
            ].map(a=>(
              <a key={a.label} href={a.href} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 hover:bg-gray-50 transition">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center"><a.icon size={16}/></span>
                <span className="text-sm font-medium text-gray-900">{a.label}</span>
              </a>
            ))}
          </div>

          {/* today menu minimal */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Today · {todayMenu ? (todayMenu.day.charAt(0)+todayMenu.day.slice(1).toLowerCase()) : '—'}</h3>
              <a href="/student/food" className="text-xs font-medium text-gray-600 hover:text-gray-900">Weekly menu →</a>
            </div>
            {todayMenu ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  {k:'BREAKFAST', v:todayMenu.breakfast},
                  {k:'LUNCH', v:todayMenu.lunch},
                  {k:'SNACKS', v:todayMenu.snacks},
                  {k:'DINNER', v:todayMenu.dinner},
                ].map(it=>(
                  <div key={it.k} className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[11px] tracking-wide text-gray-500">{it.k}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{it.v || '—'}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">No menu</p>}
          </div>

        </div>

        {/* right column - stats minimal */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs tracking-wide text-gray-500">MY ROOM</p>
            {qStudent.isLoading ? <p className="text-sm text-gray-400 mt-2">Loading…</p>
              : !room ? (
                <>
                  <p className="text-lg font-semibold mt-1">Not allocated</p>
                  <p className="text-xs text-gray-500 mt-1">Contact warden</p>
                  <a href="/student/room" className="mt-3 inline-flex text-xs font-medium text-gray-900 underline">View room</a>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold mt-1">{roomNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">Block {room.block} · Floor {room.floor}</p>
                  <p className="text-xs text-gray-500">{room.occupied}/{room.capacity} occupied</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3"><div className="h-full bg-gray-900" style={{width:`${room.capacity?Math.round(room.occupied/room.capacity*100):0}%`}}/></div>
                  <a href="/student/room" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-900 hover:gap-1.5 transition">View room <ChevronRight size={14}/></a>
                </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs tracking-wide text-gray-500">ATTENDANCE</p>
              <p className="text-2xl font-semibold mt-1">{attRate}%</p>
              <p className="text-xs text-gray-500 mt-1">{present} present · {absent} absent</p>
              <a href="/student/attendance" className="mt-3 inline-flex text-xs font-medium text-gray-900 underline">Details</a>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs tracking-wide text-gray-500">OUTING</p>
              <p className="text-sm font-semibold mt-1 truncate">{approvedOutings[0]?.destination ?? 'No outing'}</p>
              <p className="text-xs mt-1">{approvedOutings[0] ? <span className="inline-flex items-center gap-1 text-green-600"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"/>Approved</span> : <span className="text-gray-500">No upcoming</span>}</p>
              <a href="/student/outings" className="mt-3 inline-flex text-xs font-medium text-gray-900 underline">View</a>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs tracking-wide text-gray-500">COMPLAINTS</p>
            <p className="text-2xl font-semibold mt-1">{pendingComplaints.length + inProgress.length}</p>
            <p className="text-xs text-gray-500 mt-1">{inProgress.length} in progress · {pendingComplaints.length} pending</p>
            <a href="/student/complaints" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-900 hover:gap-1.5 transition">View complaints <ChevronRight size={14}/></a>
          </div>
        </div>
      </div>
    </div>
  )
}
