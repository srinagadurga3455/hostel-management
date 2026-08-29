import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '../../api/attendance.api'
import { studentsApi } from '../../api/students.api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { getErrorMessage } from '../../api/client'
import { useState, useMemo, useEffect } from 'react'
import { Check, X, Calendar, Search, Users, UserCheck, UserX, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE_SHEET = 12
const PAGE_SIZE_HISTORY = 10
const todayStr = () => new Date().toISOString().slice(0, 10)

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDisplay(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

export default function WardenAttendance() {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [sheetSearch, setSheetSearch] = useState('')
  const [sheetStatus, setSheetStatus] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'UNMARKED'>('ALL')
  const [sheetBranch, setSheetBranch] = useState('ALL')
  const [sheetPage, setSheetPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'sheet' | 'history'>('sheet')
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())

  // history filters
  const [histSearch, setHistSearch] = useState('')
  const [histStatus, setHistStatus] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL')
  const [histDate, setHistDate] = useState('')
  const [histPage, setHistPage] = useState(1)

  const { data: attendance, isLoading, error } = useQuery({ queryKey: ['attendance'], queryFn: attendanceApi.list })
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: studentsApi.list })

  const createMut = useMutation({
    mutationFn: attendanceApi.create,
    onSuccess: (created) => {
      qc.setQueryData(['attendance'], (old: any) => (old ? [...old, created] : [created]))
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (e) => setErr(getErrorMessage(e)),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'PRESENT' | 'ABSENT' }) => attendanceApi.update(id, { status }),
    onSuccess: (updated) => {
      qc.setQueryData(['attendance'], (old: any) => (old ? old.map((a: any) => (a.id === updated.id ? updated : a)) : [updated]))
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (e) => setErr(getErrorMessage(e)),
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const branches = useMemo(() => Array.from(new Set((students ?? []).map((s) => s.branch))).sort(), [students])

  const attendanceByStudentForDate = useMemo(() => {
    const map = new Map<number, { id: number; status: 'PRESENT' | 'ABSENT' }>()
    attendance?.forEach((a: any) => {
      const sid = a.studentId ?? a.student_id
      const d = typeof a.date === 'string' ? a.date.slice(0, 10) : String(a.date).slice(0, 10)
      if (d === selectedDate && sid != null) map.set(sid, { id: a.id, status: a.status })
    })
    return map
  }, [attendance, selectedDate])

  const studentMap = useMemo(() => {
    const m = new Map<number, string>()
    students?.forEach((s) => m.set(s.id, `${s.user.name} (${s.rollNumber})`))
    return m
  }, [students])

  const getSid = (a: any) => a.studentId ?? a.student_id
  const getDate = (a: any) => (typeof a.date === 'string' ? a.date.slice(0, 10) : String(a.date).slice(0, 10))

  // stats for selected date
  const stats = useMemo(() => {
    if (!students) return { total: 0, present: 0, absent: 0, unmarked: 0, pct: 0 }
    let present = 0, absent = 0
    students.forEach((s) => {
      const rec = attendanceByStudentForDate.get(s.id)
      if (rec?.status === 'PRESENT') present++
      else if (rec?.status === 'ABSENT') absent++
    })
    const total = students.length
    const unmarked = total - present - absent
    const pct = total ? Math.round((present / total) * 100) : 0
    return { total, present, absent, unmarked, pct }
  }, [students, attendanceByStudentForDate])

  const roster = useMemo(() => {
    if (!students) return []
    return students.filter((s) => {
      if (sheetSearch) {
        const q = sheetSearch.toLowerCase()
        if (!`${s.user.name} ${s.rollNumber} ${s.branch} ${s.room?.roomNumber ?? ''}`.toLowerCase().includes(q)) return false
      }
      if (sheetBranch !== 'ALL' && s.branch !== sheetBranch) return false
      const rec = attendanceByStudentForDate.get(s.id)
      const st = rec?.status ?? 'UNMARKED'
      if (sheetStatus !== 'ALL' && st !== sheetStatus) return false
      return true
    })
  }, [students, sheetSearch, sheetBranch, sheetStatus, attendanceByStudentForDate])

  useEffect(() => setSheetPage(1), [sheetSearch, sheetBranch, sheetStatus, selectedDate])
  const sheetTotalPages = Math.max(1, Math.ceil(roster.length / PAGE_SIZE_SHEET))
  const sheetPaginated = useMemo(() => {
    const p = Math.min(sheetPage, sheetTotalPages)
    return roster.slice((p - 1) * PAGE_SIZE_SHEET, p * PAGE_SIZE_SHEET)
  }, [roster, sheetPage, sheetTotalPages])
  useEffect(() => { if (sheetPage > sheetTotalPages) setSheetPage(sheetTotalPages) }, [sheetPage, sheetTotalPages])

  // history
  const historyFiltered = useMemo(() => {
    if (!attendance) return []
    return attendance.filter((a: any) => {
      const sid = getSid(a)
      if (histSearch) {
        const q = histSearch.toLowerCase()
        const name = (studentMap.get(sid) ?? String(sid)).toLowerCase()
        if (!name.includes(q) && !getDate(a).toLowerCase().includes(q)) return false
      }
      if (histStatus !== 'ALL' && a.status !== histStatus) return false
      if (histDate && getDate(a) !== histDate) return false
      return true
    }).sort((a: any, b: any) => getDate(b).localeCompare(getDate(a)))
  }, [attendance, histSearch, histStatus, histDate, studentMap])

  useEffect(() => setHistPage(1), [histSearch, histStatus, histDate])
  const histTotalPages = Math.max(1, Math.ceil(historyFiltered.length / PAGE_SIZE_HISTORY))
  const histPaginated = useMemo(() => historyFiltered.slice((Math.min(histPage, histTotalPages) - 1) * PAGE_SIZE_HISTORY, Math.min(histPage, histTotalPages) * PAGE_SIZE_HISTORY), [historyFiltered, histPage, histTotalPages])
  useEffect(() => { if (histPage > histTotalPages) setHistPage(histTotalPages) }, [histPage, histTotalPages])

  const mark = async (studentId: number, status: 'PRESENT' | 'ABSENT') => {
    const rec = attendanceByStudentForDate.get(studentId)
    if (rec?.status === status) return
    setPendingIds((prev) => new Set(prev).add(studentId))
    setErr('')
    // optimistic: patch cache immediately so UI shows updated without waiting for refetch
    const prevData = qc.getQueryData(['attendance']) as any[] | undefined
    if (rec) {
      qc.setQueryData(['attendance'], (old: any) => old?.map((a: any) => (a.id === rec.id ? { ...a, status } : a)) ?? old)
    } else {
      const temp = { id: -studentId, studentId, student_id: studentId, date: selectedDate, status }
      qc.setQueryData(['attendance'], (old: any) => (old ? [...old, temp] : [temp]))
    }
    try {
      if (rec) {
        await updateMut.mutateAsync({ id: rec.id, status })
        showToast(status === 'PRESENT' ? 'Marked present' : 'Marked absent')
      } else {
        try {
          await createMut.mutateAsync({ studentId, date: selectedDate, status })
          showToast(status === 'PRESENT' ? 'Marked present' : 'Marked absent')
        } catch (e: any) {
          const msg = getErrorMessage(e)
          if (msg.includes('already exists') || e?.response?.status === 409) {
            // race: record was created elsewhere, refetch then update
            await qc.invalidateQueries({ queryKey: ['attendance'] })
            await qc.refetchQueries({ queryKey: ['attendance'] })
            const fresh = (qc.getQueryData(['attendance']) as any[])?.find((a: any) => getSid(a) === studentId && getDate(a) === selectedDate)
            if (fresh) await updateMut.mutateAsync({ id: fresh.id, status })
            else throw e
            showToast(status === 'PRESENT' ? 'Marked present' : 'Marked absent')
          } else throw e
        }
      }
    } catch (e) {
      // rollback on failure
      if (prevData) qc.setQueryData(['attendance'], prevData)
      else qc.invalidateQueries({ queryKey: ['attendance'] })
      setErr(getErrorMessage(e))
    } finally {
      setPendingIds((prev) => {
        const n = new Set(prev)
        n.delete(studentId)
        return n
      })
      qc.invalidateQueries({ queryKey: ['attendance'] })
    }
  }

  const bulkMark = async (status: 'PRESENT' | 'ABSENT') => {
    const targets = roster.filter((s) => attendanceByStudentForDate.get(s.id)?.status !== status)
    if (!targets.length) { showToast('All filtered students already marked'); return }
    setErr('')
    let ok = 0
    for (const s of targets) {
      const rec = attendanceByStudentForDate.get(s.id)
      try {
        setPendingIds((prev) => new Set(prev).add(s.id))
        if (rec) await updateMut.mutateAsync({ id: rec.id, status })
        else await createMut.mutateAsync({ studentId: s.id, date: selectedDate, status })
        ok++
      } catch { /* keep going */ }
      finally {
        setPendingIds((prev) => { const n = new Set(prev); n.delete(s.id); return n })
      }
    }
    showToast(`${ok} marked ${status.toLowerCase()}`)
  }

  const isFuture = selectedDate > todayStr()
  const isToday = selectedDate === todayStr()

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance" desc="Daily roster — mark quickly, track history" />

      {err && <div className="rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-700">{err}</div>}
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm shadow-lg">{toast}</div>}

      {/* Date strip + stats */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><ChevronLeft size={16} /></button>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Calendar size={16} className="text-slate-500" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none" />
            </div>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} disabled={addDays(selectedDate, 1) > addDays(todayStr(), 30)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={16} /></button>
            {!isToday && <button onClick={() => setSelectedDate(todayStr())} className="rounded-full bg-slate-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-black">Today</button>}
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-slate-500">{formatDisplay(selectedDate)}</span>
            {isFuture && <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 flex items-center gap-1"><Clock size={12} />Future date</span>}
            {isToday && <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">Today</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 border"><Users size={18} className="text-slate-600" /></div>
            <div><p className="text-xs text-slate-500">Total</p><p className="text-base font-semibold tracking-tight leading-none">{stats.total}</p><p className="text-xs text-slate-400">{stats.pct}% present</p></div>
            <div className="ml-auto hidden sm:block w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-900" style={{ width: `${stats.pct}%` }} /></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 border border-slate-200"><UserCheck size={18} className="text-slate-600" /></div>
            <div><p className="text-xs text-slate-700">Present</p><p className="text-base font-semibold tracking-tight text-slate-700 leading-none">{stats.present}</p><p className="text-xs text-slate-600/70">{stats.total ? Math.round(stats.present / stats.total * 100) : 0}%</p></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 border border-slate-200"><UserX size={18} className="text-slate-600" /></div>
            <div><p className="text-xs text-slate-700">Absent</p><p className="text-base font-semibold tracking-tight text-slate-700 leading-none">{stats.absent}</p><p className="text-xs text-slate-600/70">{stats.total ? Math.round(stats.absent / stats.total * 100) : 0}%</p></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 border border-slate-200"><Clock size={18} className="text-slate-600" /></div>
            <div><p className="text-xs text-slate-700">Unmarked</p><p className="text-base font-semibold tracking-tight text-slate-700 leading-none">{stats.unmarked}</p><p className="text-xs text-slate-600/70">needs action</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('sheet')} className={`rounded-full px-4 py-2 text-sm font-medium border ${activeTab === 'sheet' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Take Attendance</button>
        <button onClick={() => setActiveTab('history')} className={`rounded-full px-4 py-2 text-sm font-medium border ${activeTab === 'history' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>History · {attendance?.length ?? 0}</button>
      </div>

      {activeTab === 'sheet' ? (
        <>
          {/* Sheet toolbar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
            <div className="relative max-w-xs flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <Input placeholder="Search name, roll, branch, room..." value={sheetSearch} onChange={(e) => setSheetSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={sheetBranch} onChange={(e) => setSheetBranch(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="ALL">All branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={sheetStatus} onChange={(e) => setSheetStatus(e.target.value as never)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="ALL">All</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="UNMARKED">Unmarked</option>
            </select>
            <span className="text-sm text-slate-500 ml-auto hidden sm:inline">{roster.length} students</span>
            <div className="flex gap-2 ml-auto sm:ml-0">
              <Button onClick={() => bulkMark('PRESENT')} variant="outline" className="border-slate-200 text-slate-700 hover:bg-white text-xs px-3 py-2 h-9"><Check size={14} className="mr-1" /> All Present</Button>
              <Button onClick={() => bulkMark('ABSENT')} variant="outline" className="border-slate-200 text-slate-700 hover:bg-white text-xs px-3 py-2 h-9"><X size={14} className="mr-1" /> All Absent</Button>
            </div>
          </div>

          {isLoading ? <div className="flex justify-center p-8"><Spinner /></div> : !students?.length ? <EmptyState title="No students yet" /> : !roster.length ? <EmptyState title="No students match filters" /> : (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Student</th>
                      <th className="px-3 py-3 text-left font-semibold hidden md:table-cell">Branch</th>
                      <th className="px-3 py-3 text-left font-semibold hidden sm:table-cell">Room</th>
                      <th className="px-3 py-3 text-center font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sheetPaginated.map((s) => {
                      const rec = attendanceByStudentForDate.get(s.id)
                      const status = rec?.status ?? null
                      const isPending = pendingIds.has(s.id)
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50 ${!status ? 'bg-slate-50/50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">{s.user.name.slice(0, 2).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">{s.user.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{s.rollNumber} · Year {s.year}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600 hidden md:table-cell">{s.branch}</td>
                          <td className="px-3 py-3 hidden sm:table-cell"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{s.room?.roomNumber ?? '—'}</span></td>
                          <td className="px-3 py-3 text-center">
                            {!status ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Unmarked</span>
                              : status === 'PRESENT' ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present</span>
                              : <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-red-500"></span> Absent</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              <button
                                disabled={isPending}
                                onClick={() => mark(s.id, 'PRESENT')}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${status === 'PRESENT' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-white'} disabled:opacity-50`}
                              >
                                <Check size={14} /> Present
                              </button>
                              <button
                                disabled={isPending}
                                onClick={() => mark(s.id, 'ABSENT')}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${status === 'ABSENT' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-white hover:border-slate-200 hover:text-slate-700'} disabled:opacity-50`}
                              >
                                <X size={14} /> Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={sheetPage} totalPages={sheetTotalPages} totalItems={roster.length} pageSize={PAGE_SIZE_SHEET} onPageChange={setSheetPage} />
              <div className="border-t bg-slate-50 px-4 py-2.5 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>Tip: Use <b>All Present / All Absent</b> for bulk, then fix exceptions. Status saves instantly.</span>
                <span className="ml-auto">{stats.unmarked ? `${stats.unmarked} unmarked for ${formatDisplay(selectedDate)}` : `All marked for ${formatDisplay(selectedDate)} ✓`}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
            <div className="relative max-w-xs flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <Input placeholder="Search student / date..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={histStatus} onChange={(e) => setHistStatus(e.target.value as never)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="ALL">All status</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option>
            </select>
            <Input type="date" value={histDate} onChange={(e) => setHistDate(e.target.value)} className="max-w-[180px]" />
            {histDate && <button onClick={() => setHistDate('')} className="text-sm text-slate-500 underline">Clear</button>}
            <span className="text-sm text-gray-500 ml-auto">{historyFiltered.length} records</span>
          </div>

          {isLoading ? <div className="flex justify-center p-8"><Spinner /></div> : error ? <ErrorState message={getErrorMessage(error)} /> : !historyFiltered.length ? <EmptyState title={attendance?.length ? 'No records match filters' : 'No attendance yet'} /> : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="p-3 text-left">Student</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
                  <tbody>
                    {histPaginated.map((a: any) => (
                      <tr key={a.id} className="border-t hover:bg-slate-50">
                        <td className="p-3">{studentMap.get(getSid(a)) ?? getSid(a)}</td>
                        <td className="p-3 text-center font-mono text-xs">{getDate(a)}</td>
                        <td className="p-3 text-center">{a.status === 'PRESENT' ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-red-500"></span> Absent</span>}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={async () => {
                              setErr('')
                              try { await updateMut.mutateAsync({ id: a.id, status: a.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }); showToast('Updated') } catch (e) { setErr(getErrorMessage(e)) }
                            }}
                            className="text-xs font-medium text-slate-900 hover:underline"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={histPage} totalPages={histTotalPages} totalItems={historyFiltered.length} pageSize={PAGE_SIZE_HISTORY} onPageChange={setHistPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
