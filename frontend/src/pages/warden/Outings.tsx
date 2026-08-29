import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { outingsApi } from '../../api/outings.api'
import { studentsApi } from '../../api/students.api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Pagination } from '../../components/ui/Pagination'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { getErrorMessage } from '../../api/client'
import { useState, useMemo, useEffect } from 'react'
import { Plane, MapPin, Clock, Calendar, Search, Check, X, Users, Filter, Timer, Building2 } from 'lucide-react'

const PAGE_SIZE = 8

export default function WardenOutings() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL'|'PENDING'|'APPROVED'|'REJECTED'>('ALL')
  const [tab, setTab] = useState<'pending'|'all'>('pending')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any | null>(null)
  const [confirm, setConfirm] = useState<{id:number, action:'approve'|'reject'}|null>(null)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2200) }

  const { data, isLoading, error } = useQuery({ queryKey: ['outings'], queryFn: outingsApi.list })
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: studentsApi.list })

  const studentMap = useMemo(()=>{
    const m = new Map<number, any>()
    students?.forEach(s=> m.set(s.id, s))
    return m
  },[students])

  const approve = useMutation({
    mutationFn: outingsApi.approve,
    onSuccess:(u)=>{ qc.setQueryData(['outings'], (old:any)=> old?.map((x:any)=> x.id===u.id? u:x)); qc.invalidateQueries({queryKey:['outings']}); showToast('Outing approved') },
    onError:(e)=> showToast(getErrorMessage(e)),
  })
  const reject = useMutation({
    mutationFn: outingsApi.reject,
    onSuccess:(u)=>{ qc.setQueryData(['outings'], (old:any)=> old?.map((x:any)=> x.id===u.id? u:x)); qc.invalidateQueries({queryKey:['outings']}); showToast('Outing rejected') },
    onError:(e)=> showToast(getErrorMessage(e)),
  })

  const stats = useMemo(()=>{
    const pending = data?.filter(o=> o.status==='PENDING').length ?? 0
    const approved = data?.filter(o=> o.status==='APPROVED').length ?? 0
    const rejected = data?.filter(o=> o.status==='REJECTED').length ?? 0
    const today = new Date().toISOString().slice(0,10)
    const todayOutings = data?.filter(o=> o.outingDate.slice(0,10)===today).length ?? 0
    return { pending, approved, rejected, todayOutings, total: data?.length ?? 0 }
  },[data])

  const filtered = useMemo(()=>{
    if(!data) return []
    return data.filter(o=>{
      if(tab==='pending' && o.status!=='PENDING') return false
      if(search && !`${o.destination} ${o.reason} ${o.outingDate} ${o.outTime} ${o.inTime}`.toLowerCase().includes(search.toLowerCase())){
        const s = studentMap.get(o.studentId); if(s && !`${s.user.name} ${s.rollNumber}`.toLowerCase().includes(search.toLowerCase())) return false
        else if(!s) return false
      }
      if(statusFilter!=='ALL' && o.status!==statusFilter) return false
      return true
    }).sort((a,b)=> b.outingDate.localeCompare(a.outingDate))
  },[data,search,statusFilter,tab,studentMap])

  const allFiltered = useMemo(()=>{
    if(!data) return []
    return data.filter(o=>{
      if(search && !`${o.destination} ${o.reason} ${o.outingDate}`.toLowerCase().includes(search.toLowerCase())){
        const s = studentMap.get(o.studentId); if(s && !`${s.user.name} ${s.rollNumber}`.toLowerCase().includes(search.toLowerCase())) return false
        else if(!s) return false
      }
      if(statusFilter!=='ALL' && o.status!==statusFilter) return false
      return true
    }).sort((a,b)=> b.outingDate.localeCompare(a.outingDate))
  },[data,search,statusFilter,studentMap])

  const list = tab==='pending' ? filtered : allFiltered
  useEffect(()=> setPage(1),[search,statusFilter,tab])
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const paginated = useMemo(()=> list.slice((Math.min(page,totalPages)-1)*PAGE_SIZE, Math.min(page,totalPages)*PAGE_SIZE),[list,page,totalPages])
  useEffect(()=>{ if(page>totalPages) setPage(totalPages)},[page,totalPages])

  const doAction = async ()=>{
    if(!confirm) return
    if(confirm.action==='approve') await approve.mutateAsync(confirm.id)
    else await reject.mutateAsync(confirm.id)
    setConfirm(null); setSelected(null)
  }

  const bulkApprovePending = async ()=>{
    const pend = filtered
    if(!pend.length) return showToast('No pending to approve')
    for(const o of pend){ try{ await approve.mutateAsync(o.id)} catch{} }
    showToast(`Approved ${pend.length}`)
  }

  if(isLoading) return <div className="flex justify-center p-8"><Spinner/></div>
  if(error) return <ErrorState message={getErrorMessage(error)}/>

  return (
    <div className="space-y-5">
      <PageHeader title="Outings" desc="Day outings — review destination, timing & student context" />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm shadow-lg">{toast}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center"><Clock size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-700">Pending</p><p className="text-xl font-semibold tracking-tight text-slate-700">{stats.pending}</p></div>
          <span className="ml-auto hidden sm:inline text-xs bg-white border px-2 py-1 rounded-full">needs action</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center"><Check size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-500">Approved</p><p className="text-xl font-semibold tracking-tight text-slate-600">{stats.approved}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center"><Plane size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-500">Today</p><p className="text-xl font-semibold tracking-tight">{stats.todayOutings}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Users size={18}/></div>
          <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-semibold tracking-tight">{stats.total}</p></div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={()=> setTab('pending')} className={`rounded-full px-4 py-2 text-sm font-medium border ${tab==='pending'? 'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>Pending · {stats.pending}</button>
        <button onClick={()=> setTab('all')} className={`rounded-full px-4 py-2 text-sm font-medium border ${tab==='all'? 'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>All requests</button>
        {tab==='pending' && stats.pending>1 && <Button variant="outline" className="ml-auto gap-1 border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={bulkApprovePending}><Check size={14}/> Approve all pending</Button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
          <Input placeholder="Search student, destination, reason..." value={search} onChange={e=> setSearch(e.target.value)} className="pl-9"/>
        </div>
        <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All status</option><option>PENDING</option><option>APPROVED</option><option>REJECTED</option>
        </select>
        <span className="text-sm text-slate-500 ml-auto">{list.length} requests</span>
      </div>

      {!data?.length ? <EmptyState title="No outings"/> : !list.length ? <EmptyState title={tab==='pending'? 'No pending outings 🎉':'No outings match filters'}/> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginated.map(o=>{
              const s = studentMap.get(o.studentId)
              const isPending = o.status==='PENDING'
              return (
                <div key={o.id} className={`rounded-xl border bg-white p-5 hover:border-slate-300 transition relative overflow-hidden ${isPending? 'border-slate-200':'border-slate-100'}`}>
                  
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">{s? s.user.name.slice(0,2).toUpperCase(): '??'}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{s? `${s.user.name} · ${s.rollNumber}`: `Student #${o.studentId}`}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap"><Building2 size={12}/>{s?.branch ?? '-'} · Year {s?.year ?? '-'} {s?.room?.roomNumber && <>· <span className="px-1.5 py-0.5 rounded bg-slate-100">{s.room.roomNumber}</span></>}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className={`h-2 w-2 rounded-full ${o.status==='PENDING'? 'bg-amber-500': o.status==='APPROVED'? 'bg-emerald-500':'bg-red-500'}`}></span> {o.status}</span>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 border p-3">
                    <p className="font-semibold flex items-center gap-2"><MapPin size={14} className="text-slate-600"/>{o.destination}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{o.reason}</p>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2.5 py-1"><Calendar size={12}/>{o.outingDate.slice(0,10)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2.5 py-1"><Clock size={12}/>{o.outTime} → {o.inTime}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white border px-2.5 py-1"><Timer size={12}/>{(() => {
                        try{
                          const [sh,sm]=o.outTime.split(':').map(Number); const [eh,em]=o.inTime.split(':').map(Number);
                          let mins=(eh*60+em)-(sh*60+sm); if(mins<0) mins+=1440; const h=Math.floor(mins/60), m=mins%60; return `${h}h ${m}m`
                        }catch{ return '-' }
                      })()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" onClick={()=> setSelected(o)}>View details</Button>
                    {isPending && (
                      <>
                        <Button onClick={()=> setConfirm({id:o.id, action:'approve'})} className="flex-1 bg-slate-900 hover:bg-slate-800 gap-1"><Check size={14}/> Approve</Button>
                        <Button onClick={()=> setConfirm({id:o.id, action:'reject'})} variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-white gap-1"><X size={14}/> Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border bg-white"><Pagination page={page} totalPages={totalPages} totalItems={list.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></div>
        </>
      )}

      {/* details */}
      <Modal open={!!selected} onClose={()=> setSelected(null)} title={selected? `${selected.destination} — ${selected.outingDate.slice(0,10)}`:'Details'}>
        {selected && (()=>{ const s=studentMap.get(selected.studentId); return (
          <div className="space-y-4">
            <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border">
              <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">{s? s.user.name.slice(0,2).toUpperCase():'?'}</div>
              <div><p className="font-semibold">{s?.user.name ?? `Student #${selected.studentId}`}</p><p className="text-xs text-slate-500">{s?.rollNumber ?? ''} · {s?.branch ?? ''} · {s?.user.email ?? ''}</p><p className="text-xs text-slate-500">Room: {s?.room?.roomNumber ?? '—'}</p></div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className={`h-2 w-2 rounded-full ${selected.status==='PENDING'? 'bg-amber-500':'bg-emerald-500'}`}></span> {selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Destination</p><p className="font-medium flex items-center gap-1"><MapPin size={14}/> {selected.destination}</p></div>
              <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Date</p><p className="font-medium flex items-center gap-1"><Calendar size={14}/> {selected.outingDate.slice(0,10)}</p></div>
              <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Out → In</p><p className="font-medium">{selected.outTime} → {selected.inTime}</p></div>
              <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Reason</p><p className="font-medium line-clamp-3">{selected.reason}</p></div>
            </div>
            {selected.status==='PENDING' && (
              <div className="flex gap-2">
                <Button onClick={()=> setConfirm({id:selected.id, action:'approve'})} className="flex-1 bg-slate-900 hover:bg-slate-800"><Check size={16} className="mr-1"/> Approve</Button>
                <Button onClick={()=> setConfirm({id:selected.id, action:'reject'})} variant="outline" className="flex-1 border-slate-200 text-slate-600"><X size={16} className="mr-1"/> Reject</Button>
              </div>
            )}
          </div>
        )})()}
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={()=> setConfirm(null)} onConfirm={doAction} title={confirm?.action==='approve'? 'Approve outing?':'Reject outing?'} desc={confirm?.action==='approve'? 'Student will be allowed to go out.': 'This will reject the outing request.'} />
    </div>
  )
}
