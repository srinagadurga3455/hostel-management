import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintsApi } from '../../api/complaints.api'
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
import { MessageSquare, Search, Clock, Wrench, CheckCircle2, XCircle, AlertTriangle, Building2, Calendar, User, Filter } from 'lucide-react'

const PAGE_SIZE = 8

function getSid(c:any){ return c.studentId ?? c.student_id }
function getCreated(c:any){ return (c.createdAt ?? c.created_at ?? '').toString().slice(0,10) }
function getUpdated(c:any){ return (c.updatedAt ?? c.updated_at ?? '').toString().slice(0,10) }
function statusTone(s:string){
  const u=s.toUpperCase()
  if(u==='RESOLVED') return 'emerald'
  if(u==='REJECTED') return 'red'
  if(u==='IN_PROGRESS') return 'indigo'
  if(u==='PENDING') return 'amber'
  return 'slate'
}

export default function WardenComplaints() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL'|'PENDING'|'IN_PROGRESS'|'RESOLVED'|'REJECTED'>('ALL')
  const [tab, setTab] = useState<'queue'|'all'>('queue')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any|null>(null)
  const [confirm, setConfirm] = useState<{id:number, status:'IN_PROGRESS'|'RESOLVED'|'REJECTED'}|null>(null)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''),2200) }

  const { data, isLoading, error } = useQuery({ queryKey: ['complaints'], queryFn: complaintsApi.list })
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: studentsApi.list })

  const studentMap = useMemo(()=>{ const m=new Map<number,any>(); students?.forEach(s=> m.set(s.id,s)); return m },[students])

  const mut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => complaintsApi.updateStatus(id, { status: status as never }),
    onSuccess:(u)=>{ qc.setQueryData(['complaints'], (old:any)=> old?.map((x:any)=> x.id===u.id? u:x)); qc.invalidateQueries({queryKey:['complaints']}); showToast(`Marked ${u.status}`) },
    onError:(e)=> showToast(getErrorMessage(e)),
  })

  const stats = useMemo(()=>{
    const pending = data?.filter(c=> (c.status??'').toString().toUpperCase()==='PENDING').length ?? 0
    const inprog = data?.filter(c=> (c.status??'').toString().toUpperCase()==='IN_PROGRESS').length ?? 0
    const resolved = data?.filter(c=> (c.status??'').toString().toUpperCase()==='RESOLVED').length ?? 0
    const rejected = data?.filter(c=> (c.status??'').toString().toUpperCase()==='REJECTED').length ?? 0
    return { pending, inprog, resolved, rejected, total: data?.length ?? 0 }
  },[data])

  const queueList = useMemo(()=>{
    if(!data) return []
    return data.filter(c=>{
      const st=(c.status??'').toString().toUpperCase()
      if(st!=='PENDING' && st!=='IN_PROGRESS') return false
      if(search && !`${c.title} ${c.description}`.toLowerCase().includes(search.toLowerCase())){
        const s=studentMap.get(getSid(c)); if(s && !`${s.user.name} ${s.rollNumber}`.toLowerCase().includes(search.toLowerCase())) return false
        else if(!s) return false
      }
      if(statusFilter!=='ALL' && st!==statusFilter) return false
      return true
    }).sort((a:any,b:any)=> getCreated(b).localeCompare(getCreated(a)))
  },[data,search,statusFilter,studentMap])

  const allFiltered = useMemo(()=>{
    if(!data) return []
    return data.filter(c=>{
      const st=(c.status??'').toString().toUpperCase()
      if(search && !`${c.title} ${c.description}`.toLowerCase().includes(search.toLowerCase())){
        const s=studentMap.get(getSid(c)); if(s && !`${s.user.name} ${s.rollNumber}`.toLowerCase().includes(search.toLowerCase())) return false
        else if(!s) return false
      }
      if(statusFilter!=='ALL' && st!==statusFilter) return false
      return true
    }).sort((a:any,b:any)=> getCreated(b).localeCompare(getCreated(a)))
  },[data,search,statusFilter,studentMap])

  const list = tab==='queue'? queueList : allFiltered
  useEffect(()=> setPage(1),[search,statusFilter,tab])
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const paginated = useMemo(()=> list.slice((Math.min(page,totalPages)-1)*PAGE_SIZE, Math.min(page,totalPages)*PAGE_SIZE),[list,page,totalPages])
  useEffect(()=>{ if(page>totalPages) setPage(totalPages)},[page,totalPages])

  const nextActions = (status:string)=>{
    const s=status.toUpperCase()
    if(s==='PENDING') return [{label:'Start work', status:'IN_PROGRESS', variant:'indigo', icon:Wrench},{label:'Reject', status:'REJECTED', variant:'red', icon:XCircle}]
    if(s==='IN_PROGRESS') return [{label:'Resolve', status:'RESOLVED', variant:'emerald', icon:CheckCircle2},{label:'Reject', status:'REJECTED', variant:'red', icon:XCircle}]
    return []
  }

  const handleConfirm = async ()=>{
    if(!confirm) return
    await mut.mutateAsync({id:confirm.id, status:confirm.status})
    setConfirm(null); setSelected(null)
  }

  if(isLoading) return <div className="flex justify-center p-8"><Spinner/></div>
  if(error) return <ErrorState message={getErrorMessage(error)}/>
  if(!data?.length) return <><PageHeader title="Complaints" desc="Triage, assign & resolve"/><EmptyState title="No complaints yet" /></>

  return (
    <div className="space-y-5">
      <PageHeader title="Complaints" desc="Inbox → In Progress → Resolved — keep the pipeline moving" />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm shadow-lg">{toast}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center"><Clock size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-700">Pending</p><p className="text-xl font-semibold tracking-tight text-slate-700">{stats.pending}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center"><Wrench size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-700">In Progress</p><p className="text-xl font-semibold tracking-tight text-slate-600">{stats.inprog}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center"><CheckCircle2 size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-700">Resolved</p><p className="text-xl font-semibold tracking-tight text-slate-600">{stats.resolved}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center"><XCircle size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-700">Rejected</p><p className="text-xl font-semibold tracking-tight text-slate-600">{stats.rejected}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><MessageSquare size={18}/></div>
          <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-semibold tracking-tight">{stats.total}</p><p className="text-xs text-slate-400">{stats.pending+stats.inprog} active</p></div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={()=> setTab('queue')} className={`rounded-full px-4 py-2 text-sm font-medium border ${tab==='queue'? 'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>Queue · {stats.pending+stats.inprog}</button>
        <button onClick={()=> setTab('all')} className={`rounded-full px-4 py-2 text-sm font-medium border ${tab==='all'? 'bg-slate-900 text-white border-slate-900':'bg-white border-slate-200'}`}>All · {stats.total}</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
          <Input placeholder="Search title, description, student..." value={search} onChange={e=> setSearch(e.target.value)} className="pl-9"/>
        </div>
        <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All status</option><option>PENDING</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>REJECTED</option>
        </select>
        <span className="text-sm text-slate-500 ml-auto">{list.length} of {data.length}</span>
      </div>

      {!list.length ? <EmptyState title={tab==='queue'? 'Queue clear 🎉':'No complaints match filters'}/> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginated.map(c=>{
              const s=studentMap.get(getSid(c))
              const st=(c.status??'').toString().toUpperCase()
              const tone=statusTone(st)
              const actions=nextActions(st)
              const created=getCreated(c)
              return (
                <div key={c.id} className={`rounded-xl border bg-white p-5 hover:border-slate-300 transition relative overflow-hidden ${st==='PENDING'? 'border-slate-200': st==='IN_PROGRESS'? 'border-slate-200': st==='RESOLVED'? 'border-slate-200': 'border-slate-100'}`}>
                  
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">{s? s.user.name.slice(0,2).toUpperCase():'??'}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{s? `${s.user.name} · ${s.rollNumber}`:`Student #${getSid(c)}`}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap"><Building2 size={12}/>{s?.branch ?? '-'} · Year {s?.year ?? '-'} {s?.room?.roomNumber && <span className="px-1.5 py-0.5 rounded bg-slate-100">{s.room.roomNumber}</span>} · <Calendar size={12}/>{created||'-'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className={`h-2 w-2 rounded-full ${tone==='amber'? 'bg-amber-500': tone==='indigo'? 'bg-slate-500': tone==='emerald'? 'bg-emerald-500':'bg-red-500'}`}></span> {st}</span>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 border p-3">
                    <p className="font-semibold flex items-center gap-2 text-sm"><MessageSquare size={14} className="text-slate-600"/>{c.title}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-3">{c.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12}/> Filed {created||'-'}</div>
                      {s && <div className="flex items-center gap-1 text-xs text-slate-500"><User size={12}/>{s.user.email}</div>}
                    </div>
                  </div>

                  {/* stepper */}
                  <div className="flex items-center gap-1 mt-4 text-[11px] font-semibold tracking-wide">
                    <span className={`px-2 py-1 rounded-full ${['PENDING','IN_PROGRESS','RESOLVED'].includes(st)? 'bg-white0 text-white':'bg-slate-100 text-slate-400'}`}>PENDING</span>
                    <span className="text-slate-300">→</span>
                    <span className={`px-2 py-1 rounded-full ${['IN_PROGRESS','RESOLVED'].includes(st)? 'bg-white0 text-white':'bg-slate-100 text-slate-400'}`}>IN PROGRESS</span>
                    <span className="text-slate-300">→</span>
                    <span className={`px-2 py-1 rounded-full ${st==='RESOLVED'? 'bg-white0 text-white': st==='REJECTED'? 'bg-white0 text-white':'bg-slate-100 text-slate-400'}`}>{st==='REJECTED'? 'REJECTED':'RESOLVED'}</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" onClick={()=> setSelected(c)}>View</Button>
                    {actions.map(a=>{
                      const Icon=a.icon
                      return <Button key={a.status} onClick={()=> setConfirm({id:c.id, status:a.status as any})} className={`flex-1 gap-1 ${a.variant==='emerald'? 'bg-slate-900 hover:bg-slate-800': a.variant==='indigo'? 'bg-slate-900 hover:bg-slate-800': a.variant==='red'? 'bg-white border border-slate-200 text-slate-600 hover:bg-white':''}`} variant={a.variant==='red'? 'outline': undefined}><Icon size={14}/>{a.label}</Button>
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border bg-white"><Pagination page={page} totalPages={totalPages} totalItems={list.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></div>
        </>
      )}

      <Modal open={!!selected} onClose={()=> setSelected(null)} title={selected? selected.title:'Details'}>
        {selected && (()=>{ const s=studentMap.get(getSid(selected)); const st=(selected.status??'').toString().toUpperCase(); return (
          <div className="space-y-4">
            <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border">
              <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">{s? s.user.name.slice(0,2).toUpperCase():'?'}</div>
              <div><p className="font-semibold">{s?.user.name ?? `Student #${getSid(selected)}`}</p><p className="text-xs text-slate-500">{s?.rollNumber ?? ''} · {s?.branch ?? ''} · {s?.user.email ?? ''}</p><p className="text-xs text-slate-500">Room: {s?.room?.roomNumber ?? '—'} · Filed: {getCreated(selected)||'-'}</p></div>
              <span className={`ml-auto h-fit rounded-full px-2.5 py-1 text-xs font-semibold border ${statusTone(st)==='amber'? 'bg-white border-slate-200 text-slate-700': statusTone(st)==='indigo'? 'bg-white border-slate-200 text-slate-700': statusTone(st)==='emerald'? 'bg-white border-slate-200 text-slate-700':'bg-white border-slate-200 text-slate-700'}`}>{st}</span>
            </div>
            <div className="rounded-xl border p-4 bg-white">
              <p className="text-xs tracking-widest font-semibold text-slate-400">TITLE</p><p className="font-semibold mt-1">{selected.title}</p>
              <p className="text-xs tracking-widest font-semibold text-slate-400 mt-4">DESCRIPTION</p><p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{selected.description}</p>
            </div>
            <div className="rounded-xl border p-3 bg-slate-50 flex items-center gap-2 text-xs">
              <Calendar size={14}/> Created {getCreated(selected)||'-'} {getUpdated(selected) && getUpdated(selected)!==getCreated(selected) && <>· Updated {getUpdated(selected)}</>}
            </div>
            <div className="flex gap-2">
              {nextActions(st).map(a=>{
                const Icon=a.icon
                return <Button key={a.status} onClick={()=> setConfirm({id:selected.id, status:a.status as any})} className={`flex-1 gap-1 ${a.variant==='emerald'? 'bg-slate-900 hover:bg-slate-800': a.variant==='indigo'? 'bg-slate-900 hover:bg-slate-800':''}`} variant={a.variant==='red'? 'outline':undefined}><Icon size={14}/>{a.label}</Button>
              })}
              {nextActions(st).length===0 && <p className="text-sm text-slate-500 w-full text-center py-2">No further actions — this complaint is {st.toLowerCase()}.</p>}
            </div>
          </div>
        )})()}
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={()=> setConfirm(null)} onConfirm={handleConfirm} title={confirm? `Mark as ${confirm.status.replace('_',' ')}?`:''} desc={confirm?.status==='IN_PROGRESS'? 'Move to In Progress — you are now handling this.': confirm?.status==='RESOLVED'? 'Mark as resolved — student will be notified.':'Reject this complaint.'} />
    </div>
  )
}
