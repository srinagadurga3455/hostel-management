import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesApi } from '../../api/leaves.api'
import { studentsApi } from '../../api/students.api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { getErrorMessage } from '../../api/client'
import { useState, useMemo, useEffect } from 'react'
import { Calendar, Search, Check, X, Users, Clock, Timer, Building2, FileText, AlertTriangle } from 'lucide-react'

const PAGE_SIZE = 8
function getStart(l:any){ return (l.startDate ?? (l as any).start_date ?? '').toString() }
function getEnd(l:any){ return (l.endDate ?? (l as any).end_date ?? '').toString() }
function getSidL(l:any){ return l.studentId ?? (l as any).student_id }
function daysBetween(a:string,b:string){
  try{ if(!a||!b) return 1; const d1=new Date(a.slice(0,10)+'T00:00:00'), d2=new Date(b.slice(0,10)+'T00:00:00'); const diff=Math.round((d2.getTime()-d1.getTime())/86400000)+1; return diff>0? diff:1 }catch{ return 1 }
}

export default function WardenLeaves() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL'|'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'>('ALL')
  const [tab, setTab] = useState<'pending'|'all'>('pending')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any|null>(null)
  const [confirm, setConfirm] = useState<{id:number, action:'approve'|'reject'}|null>(null)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2200) }

  const { data, isLoading, error } = useQuery({ queryKey: ['leaves'], queryFn: leavesApi.list })
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: studentsApi.list })
  const studentMap = useMemo(()=>{ const m=new Map<number,any>(); students?.forEach(s=> m.set(s.id,s)); return m },[students])

  const approve = useMutation({ mutationFn: leavesApi.approve, onSuccess:(u)=>{ qc.setQueryData(['leaves'], (old:any)=> old?.map((x:any)=> x.id===u.id? u:x)); qc.invalidateQueries({queryKey:['leaves']}); showToast('Leave approved') }, onError:(e)=> showToast(getErrorMessage(e)) })
  const reject = useMutation({ mutationFn: leavesApi.reject, onSuccess:(u)=>{ qc.setQueryData(['leaves'], (old:any)=> old?.map((x:any)=> x.id===u.id? u:x)); qc.invalidateQueries({queryKey:['leaves']}); showToast('Leave rejected') }, onError:(e)=> showToast(getErrorMessage(e)) })

  const stats = useMemo(()=>{
    const pending=data?.filter(l=> (l.status??'').toString().toUpperCase()==='PENDING').length ?? 0
    const approved=data?.filter(l=> (l.status??'').toString().toUpperCase()==='APPROVED').length ?? 0
    const total=data?.length ?? 0
    const longLeaves = data?.filter(l=> daysBetween(getStart(l).slice(0,10), getEnd(l).slice(0,10))>3).length ?? 0
    return { pending, approved, total, longLeaves }
  },[data])

  const filtered = useMemo(()=>{
    if(!data) return []
    return data.filter(l=>{
      const st=(l.status??'').toString().toUpperCase()
      if(tab==='pending' && st!=='PENDING') return false
      if(search){
        const q=search.toLowerCase()
        if(!`${l.reason} ${getStart(l)} ${getEnd(l)}`.toLowerCase().includes(q)){
          const s=studentMap.get(getSidL(l)); if(s && !`${s.user.name} ${s.rollNumber}`.toLowerCase().includes(q)) return false
          else if(!s) return false
        }
      }
      if(statusFilter!=='ALL' && st!==statusFilter) return false
      return true
    }).sort((a:any,b:any)=> getStart(b).localeCompare(getStart(a)))
  },[data,search,statusFilter,tab,studentMap])

  const allFiltered = useMemo(()=>{
    if(!data) return []
    return data.filter(l=>{
      const st=(l.status??'').toString().toUpperCase()
      if(search && !`${l.reason} ${getStart(l)} ${getEnd(l)}`.toLowerCase().includes(search.toLowerCase())){
        const s=studentMap.get(getSidL(l)); if(s && !`${s.user.name} ${s.rollNumber}`.toLowerCase().includes(search.toLowerCase())) return false
        else if(!s) return false
      }
      if(statusFilter!=='ALL' && st!==statusFilter) return false
      return true
    }).sort((a:any,b:any)=> getStart(b).localeCompare(getStart(a)))
  },[data,search,statusFilter,studentMap])

  const list = tab==='pending'? filtered: allFiltered
  useEffect(()=> setPage(1),[search,statusFilter,tab])
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const paginated = useMemo(()=> list.slice((Math.min(page,totalPages)-1)*PAGE_SIZE, Math.min(page,totalPages)*PAGE_SIZE),[list,page,totalPages])
  useEffect(()=>{ if(page>totalPages) setPage(totalPages)},[page,totalPages])

  const doAction = async ()=>{ if(!confirm) return; if(confirm.action==='approve') await approve.mutateAsync(confirm.id); else await reject.mutateAsync(confirm.id); setConfirm(null); setSelected(null) }
  const bulkApprove = async ()=>{ const pend=filtered; if(!pend.length) return showToast('No pending'); for(const l of pend){ try{ await approve.mutateAsync(l.id)}catch{} } showToast(`Approved ${pend.length}`) }

  if(isLoading) return <div className="flex justify-center p-8"><Spinner/></div>
  if(error) return <ErrorState message={getErrorMessage(error)}/>

  return (
    <div className="space-y-5">
      <PageHeader title="Leaves" desc="Multi-day leaves — check duration, reason & student history" />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm shadow-lg">{toast}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center"><Clock size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-700">Pending</p><p className="text-xl font-semibold tracking-tight text-slate-700">{stats.pending}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center"><Check size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-500">Approved</p><p className="text-xl font-semibold tracking-tight text-slate-600">{stats.approved}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center"><Timer size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-500">Long (&gt;3d)</p><p className="text-xl font-semibold tracking-tight">{stats.longLeaves}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Users size={18}/></div>
          <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-semibold tracking-tight">{stats.total}</p></div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={()=> setTab('pending')} className={`rounded-full px-4 py-2 text-sm font-medium border ${tab==='pending'? 'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>Pending · {stats.pending}</button>
        <button onClick={()=> setTab('all')} className={`rounded-full px-4 py-2 text-sm font-medium border ${tab==='all'? 'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>All leaves</button>
        {tab==='pending' && stats.pending>1 && <Button variant="outline" className="ml-auto gap-1 border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={bulkApprove}><Check size={14}/> Approve all pending</Button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
          <Input placeholder="Search student, reason, date..." value={search} onChange={e=> setSearch(e.target.value)} className="pl-9"/>
        </div>
        <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All status</option><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>CANCELLED</option>
        </select>
        <span className="text-sm text-slate-500 ml-auto">{list.length} leaves</span>
      </div>

      {!data?.length ? <EmptyState title="No leaves"/> : !list.length ? <EmptyState title={tab==='pending'? 'No pending leaves 🎉':'No leaves match filters'}/> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginated.map(l=>{
              const s=studentMap.get(getSidL(l))
              const sDate=getStart(l).slice(0,10); const eDate=getEnd(l).slice(0,10)
              const d=daysBetween(sDate, eDate)
              const st=(l.status??'').toString().toUpperCase()
              const isPending=st==='PENDING'
              const isLong=d>3
              return (
                <div key={l.id} className={`rounded-xl border bg-white p-5 hover:border-slate-300 transition relative overflow-hidden ${isPending? 'border-slate-200':'border-slate-100'}`}>
                  
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">{s? s.user.name.slice(0,2).toUpperCase():'??'}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{s? `${s.user.name} · ${s.rollNumber}`:`Student #${getSidL(l)}`}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap"><Building2 size={12}/>{s?.branch ?? '-'} · Year {s?.year ?? '-'} {s?.room?.roomNumber && <span className="px-1.5 py-0.5 rounded bg-slate-100">{s.room.roomNumber}</span>}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold border ${st==='PENDING'? 'bg-white border-slate-200 text-slate-700': st==='APPROVED'? 'bg-white border-slate-200 text-slate-700': st==='REJECTED'? 'bg-white border-slate-200 text-slate-700':'bg-slate-50 border-slate-200 text-slate-600'}`}>{st}</span>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 border p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold"><Calendar size={14} className="text-slate-600"/>{sDate} <span className="text-slate-400">→</span> {eDate} <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isLong? 'bg-white0 text-white':'bg-slate-900 text-white'}`}><Timer size={12}/>{d} day{d>1? 's':''}</span></div>
                    {isLong && <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-full"><AlertTriangle size={12}/> Long leave — verify</p>}
                    <p className="text-sm text-slate-600 mt-3 flex gap-2"><FileText size={14} className="mt-0.5 shrink-0 text-slate-400"/><span className="line-clamp-3">{l.reason}</span></p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" onClick={()=> setSelected(l)}>Details</Button>
                    {isPending && <>
                      <Button onClick={()=> setConfirm({id:l.id, action:'approve'})} className="flex-1 bg-slate-900 hover:bg-slate-800 gap-1"><Check size={14}/> Approve</Button>
                      <Button onClick={()=> setConfirm({id:l.id, action:'reject'})} variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-white gap-1"><X size={14}/> Reject</Button>
                    </>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border bg-white"><Pagination page={page} totalPages={totalPages} totalItems={list.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></div>
        </>
      )}

      <Modal open={!!selected} onClose={()=> setSelected(null)} title={selected? `Leave ${getStart(selected).slice(0,10)} → ${getEnd(selected).slice(0,10)}`:'Details'}>
        {selected && (()=>{ const s=studentMap.get(getSidL(selected)); const d=daysBetween(getStart(selected).slice(0,10), getEnd(selected).slice(0,10)); return (
          <div className="space-y-4">
            <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border">
              <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">{s? s.user.name.slice(0,2).toUpperCase():'?'}</div>
              <div><p className="font-semibold">{s?.user.name ?? `Student #${getSidL(selected)}`}</p><p className="text-xs text-slate-500">{s?.rollNumber ?? ''} · {s?.branch ?? ''} · {s?.user.email ?? ''}</p><p className="text-xs text-slate-500">Room: {s?.room?.roomNumber ?? '—'}</p></div>
              <span className={`ml-auto h-fit rounded-full px-2.5 py-1 text-xs font-semibold border ${(selected.status??'').toString().toUpperCase()==='PENDING'? 'bg-white border-slate-200 text-slate-700': (selected.status??'').toString().toUpperCase()==='APPROVED'? 'bg-white border-slate-200 text-slate-700':'bg-white border-slate-200 text-slate-700'}`}>{(selected.status??'').toString().toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">From</p><p className="font-medium">{getStart(selected).slice(0,10)}</p></div>
              <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">To</p><p className="font-medium">{getEnd(selected).slice(0,10)}</p></div>
              <div className="rounded-xl border p-3 col-span-2"><p className="text-xs text-slate-500">Duration</p><p className="font-semibold flex items-center gap-2"><Timer size={14}/>{d} day{d>1?'s':''} {d>3 && <span className="text-slate-600 text-xs">(Long)</span>}</p></div>
              <div className="rounded-xl border p-3 col-span-2"><p className="text-xs text-slate-500">Reason</p><p className="font-medium whitespace-pre-wrap">{selected.reason}</p></div>
            </div>
            {selected.status==='PENDING' && <div className="flex gap-2"><Button onClick={()=> setConfirm({id:selected.id, action:'approve'})} className="flex-1 bg-slate-900 hover:bg-slate-800"><Check size={16} className="mr-1"/> Approve</Button><Button onClick={()=> setConfirm({id:selected.id, action:'reject'})} variant="outline" className="flex-1 border-slate-200 text-slate-600"><X size={16} className="mr-1"/> Reject</Button></div>}
          </div>
        )})()}
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={()=> setConfirm(null)} onConfirm={doAction} title={confirm?.action==='approve'? 'Approve leave?':'Reject leave?'} desc={confirm?.action==='approve'? 'Grant leave for these dates.':'Reject this leave request.'}/>
    </div>
  )
}
