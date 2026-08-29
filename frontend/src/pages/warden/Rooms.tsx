import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { roomsApi } from '../../api/rooms.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Pagination } from '../../components/ui/Pagination'
import { getErrorMessage } from '../../api/client'
import { useState, useMemo, useEffect } from 'react'
import { BedDouble, Building2, Layers, Users, Search, LayoutGrid, List, Pencil, Trash2, Eye, Plus, DoorOpen, UserPlus } from 'lucide-react'

const createSchema = z.object({
  roomNumber: z.string().min(1, 'Room number required'),
  block: z.string().min(1, 'Block required'),
  floor: z.coerce.number().int().min(0, 'Floor must be >=0'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be >=1'),
})
type CreateForm = z.infer<typeof createSchema>
const editSchema = z.object({
  block: z.string().min(1).optional(),
  floor: z.coerce.number().int().min(0).optional(),
  capacity: z.coerce.number().int().min(1).optional(),
})
type EditForm = z.infer<typeof editSchema>
type Room = {
  id: number
  roomNumber: string
  room_number?: string
  block: string
  floor: number
  capacity: number
  occupied: number
  students?: Array<{ id: number; rollNumber?: string; roll_number?: string; branch: string; year: number; user?: { name: string; email: string } | null }>
}
function normalizeRoom(r: any): Room {
  return { id: r.id, roomNumber: r.roomNumber ?? r.room_number ?? '', block: r.block, floor: r.floor, capacity: r.capacity, occupied: r.occupied, students: r.students ?? [] }
}
const PAGE_SIZE = 12

export default function WardenRooms() {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [viewRoom, setViewRoom] = useState<Room | null>(null)
  const [delId, setDelId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [blockFilter, setBlockFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'FULL' | 'EMPTY'>('ALL')
  const [floorFilter, setFloorFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2000) }

  const { data, isLoading, error } = useQuery({ queryKey: ['rooms'], queryFn: roomsApi.list })
  const rooms: Room[] = useMemo(() => (data ?? []).map(normalizeRoom), [data])
  const blocks = useMemo(() => Array.from(new Set(rooms.map(r=> r.block))).sort(), [rooms])
  const floors = useMemo(() => Array.from(new Set(rooms.map(r=> String(r.floor)))).sort((a,b)=> Number(a)-Number(b)), [rooms])

  const filtered = useMemo(()=> rooms.filter(r=>{
    if(search && !`${r.roomNumber} ${r.block}`.toLowerCase().includes(search.toLowerCase())) return false
    if(blockFilter!=='ALL' && r.block!==blockFilter) return false
    if(floorFilter!=='ALL' && String(r.floor)!==floorFilter) return false
    if(statusFilter==='FULL' && r.occupied < r.capacity) return false
    if(statusFilter==='AVAILABLE' && r.occupied >= r.capacity) return false
    if(statusFilter==='EMPTY' && r.occupied!==0) return false
    return true
  }),[rooms,search,blockFilter,floorFilter,statusFilter])
  useEffect(()=> setPage(1),[search,blockFilter,floorFilter,statusFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(()=> filtered.slice((Math.min(page,totalPages)-1)*PAGE_SIZE, Math.min(page,totalPages)*PAGE_SIZE),[filtered,page,totalPages])
  useEffect(()=>{ if(page>totalPages) setPage(totalPages)},[page,totalPages])

  const stats = useMemo(()=>{
    const total = rooms.length
    const cap = rooms.reduce((a,r)=> a+r.capacity,0)
    const occ = rooms.reduce((a,r)=> a+r.occupied,0)
    const avail = cap-occ
    const rate = cap? Math.round(occ/cap*100):0
    const full = rooms.filter(r=> r.occupied>=r.capacity).length
    const empty = rooms.filter(r=> r.occupied===0).length
    return { total, cap, occ, avail, rate, full, empty }
  },[rooms])

  const { register: regCreate, handleSubmit: hsCreate, reset: resetCreate, formState: { errors: errCreate } } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })
  const { register: regEdit, handleSubmit: hsEdit, reset: resetEdit, formState: { errors: errEdit } } = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  const createMut = useMutation({ mutationFn: roomsApi.create, onSuccess:(c)=>{ qc.setQueryData(['rooms'], (old:any)=> old? [...old,c]:[c]); qc.invalidateQueries({queryKey:['rooms']}); resetCreate(); setCreateOpen(false); setErr(''); showToast('Room created') }, onError:(e)=> setErr(getErrorMessage(e)) })
  const updateMut = useMutation({ mutationFn: ({id,dto}:{id:number,dto:any})=> roomsApi.update(id,dto), onSuccess:(u:any)=>{ qc.setQueryData(['rooms'], (old:any)=> old?.map((x:any)=> x.id===u.id? {...x, ...u, roomNumber: (u as any).roomNumber ?? (u as any).room_number ?? x.roomNumber}:x)); qc.invalidateQueries({queryKey:['rooms']}); setEditRoom(null); setErr(''); showToast('Room updated') }, onError:(e)=> setErr(getErrorMessage(e)) })
  const removeMut = useMutation({ mutationFn: roomsApi.remove, onSuccess:(_, id)=>{ qc.setQueryData(['rooms'], (old:any)=> old?.filter((x:any)=> x.id!==id)); qc.invalidateQueries({queryKey:['rooms']}); showToast('Room deleted') } })

  const openEdit = (r:Room)=>{ setEditRoom(r); resetEdit({ block:r.block, floor:r.floor, capacity:r.capacity }); setErr('') }
  const onCreate = (v:CreateForm)=>{ setErr(''); createMut.mutate(v as any) }
  const onEdit = (v:EditForm)=>{
    if(!editRoom) return
    const dto:any={}
    if(v.block!==undefined && v.block!==editRoom.block) dto.block=v.block
    if(v.floor!==undefined && Number(v.floor)!==editRoom.floor) dto.floor=Number(v.floor)
    if(v.capacity!==undefined && Number(v.capacity)!==editRoom.capacity) dto.capacity=Number(v.capacity)
    if(!Object.keys(dto).length){ setEditRoom(null); return }
    setErr(''); updateMut.mutate({id:editRoom.id, dto})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div><h1 className="text-xl font-semibold tracking-tight text-gray-900 flex items-center gap-2"><BedDouble className="text-slate-600"/> Rooms</h1><p className="text-sm text-gray-500 mt-1">Block & floor explorer — occupancy at a glance</p></div>
        <Button onClick={()=> { setErr(''); resetCreate(); setCreateOpen(true)}} className="gap-1"><Plus size={16}/> Create Room</Button>
      </div>

      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm shadow-lg">{toast}</div>}
      {err && !createOpen && !editRoom && <div className="rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-700">{err}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex gap-3 items-center">
          <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Building2 size={20}/></div>
          <div><p className="text-xs uppercase tracking-wide text-gray-500">Total Rooms</p><p className="text-xl font-semibold tracking-tight">{stats.total}</p><p className="text-xs text-gray-400">{stats.cap} beds · {blocks.length} blocks</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1"><Users size={12}/> Occupancy</p>
          <p className="text-xl font-semibold tracking-tight text-slate-600">{stats.occ}<span className="text-sm font-normal text-slate-400">/{stats.cap}</span></p>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2"><div className="h-full bg-slate-900" style={{width:`${stats.rate}%`}}/></div><p className="text-xs text-slate-400 mt-1">{stats.rate}% filled</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1"><DoorOpen size={12}/> Available</p><p className="text-xl font-semibold tracking-tight text-slate-600">{stats.avail}</p><p className="text-xs text-slate-400">{stats.empty} empty · {stats.total - stats.full - stats.empty} partial</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Blocks</p><div className="flex flex-wrap gap-1.5 mt-2">{blocks.length? blocks.map(b=> <span key={b} className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium">{b}</span>): <span className="text-slate-400 text-sm">—</span>}</div><p className="text-xs text-slate-400 mt-2">{stats.full} full rooms</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
          <Input placeholder="Search room or block..." value={search} onChange={e=> setSearch(e.target.value)} className="pl-9"/>
        </div>
        <select value={blockFilter} onChange={e=> setBlockFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All blocks</option>{blocks.map(b=> <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={floorFilter} onChange={e=> setFloorFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All floors</option>{floors.map(f=> <option key={f} value={f}>Floor {f}</option>)}
        </select>
        <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All status</option><option value="AVAILABLE">Available</option><option value="FULL">Full</option><option value="EMPTY">Empty</option>
        </select>
        <div className="flex rounded-full border border-slate-200 overflow-hidden ml-auto sm:ml-0">
          <button onClick={()=> setViewMode('grid')} className={`px-3 py-2 flex items-center gap-1 text-xs font-medium ${viewMode==='grid'? 'bg-slate-900 text-white':'bg-white'}`}><LayoutGrid size={14}/> Grid</button>
          <button onClick={()=> setViewMode('table')} className={`px-3 py-2 flex items-center gap-1 text-xs font-medium ${viewMode==='table'? 'bg-slate-900 text-white':'bg-white'}`}><List size={14}/> Table</button>
        </div>
        <span className="text-sm text-gray-500 ml-auto hidden lg:inline">{filtered.length} of {rooms.length}</span>
      </div>

      {isLoading ? <div className="flex justify-center p-8"><Spinner/></div> : error ? <ErrorState message={getErrorMessage(error)}/> : !filtered.length ? <EmptyState title={rooms.length? 'No rooms match filters':'No rooms yet'}/> : viewMode==='table' ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left font-semibold text-gray-600">Room</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Block / Floor</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Capacity</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Occupancy</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th><th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th></tr></thead>
              <tbody className="divide-y">
                {paginated.map(r=>{
                  const pct = r.capacity? Math.round(r.occupied/r.capacity*100):0
                  const isFull = r.occupied>=r.capacity
                  const isEmpty = r.occupied===0
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.roomNumber}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium">{r.block}</span> <span className="text-gray-600">Floor {r.floor}</span></td>
                      <td className="px-4 py-3">{r.occupied}/{r.capacity}</td>
                      <td className="px-4 py-3 w-40"><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${isFull? 'bg-white0': pct>70? 'bg-white0':'bg-green-500'}`} style={{width:`${Math.min(pct,100)}%`}}/></div><span className="text-xs text-gray-500">{pct}%</span></td>
                      <td className="px-4 py-3">{isFull? <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-red-500"></span> Full</span>: isEmpty? <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-slate-300"></span> Empty</span>: <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Available</span>}</td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={()=> setViewRoom(r)} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-slate-50"><Eye size={14}/></button><button onClick={()=> openEdit(r)} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-slate-50"><Pencil size={14}/></button><button onClick={()=> setDelId(r.id)} className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center"><Trash2 size={14}/></button></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage}/>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map(r=>{
              const pct = r.capacity? Math.round(r.occupied/r.capacity*100):0
              const isFull = r.occupied>=r.capacity
              const beds = Array.from({length:r.capacity},(_,i)=> i < r.occupied)
              return (
                <div key={r.id} className="rounded-xl border bg-white p-5 hover:border-slate-300 transition flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${isFull? 'bg-white border-slate-200 text-slate-600': r.occupied===0? 'bg-slate-50 border-slate-200 text-slate-400':'bg-white border-slate-200 text-slate-600'}`}><BedDouble size={20}/></div>
                      <div><p className="font-semibold text-lg leading-none">{r.roomNumber}</p><p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Building2 size={12}/> Block {r.block} · <Layers size={12}/> Floor {r.floor}</p></div>
                    </div>
                    {isFull? <span className="rounded-full bg-white0 text-white px-2.5 py-1 text-xs font-semibold">FULL</span>: r.occupied===0? <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">Empty</span>: <span className="rounded-full bg-white0 text-white px-2.5 py-1 text-xs font-semibold">{r.capacity - r.occupied} free</span>}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500"><span>{r.occupied}/{r.capacity} beds</span><span>{pct}%</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-1"><div className={`h-full ${isFull? 'bg-white0': pct>70? 'bg-white0':'bg-white0'}`} style={{width:`${pct}%`}}/></div>
                    <div className="flex gap-1.5 mt-3">{beds.map((occ,i)=> <div key={i} className={`h-7 flex-1 rounded-lg border flex items-center justify-center ${occ? 'bg-slate-900 border-slate-900 text-white':'bg-white border-dashed border-slate-300 text-slate-400'}`}>{occ? <Users size={12}/>: <UserPlus size={12}/>}</div>)}</div>
                  </div>
                  {r.students && r.students.length>0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold tracking-wide text-slate-500">OCCUPANTS</p>
                      <div className="mt-2 space-y-2">
                        {r.students.slice(0,3).map((s:any)=> (
                          <div key={s.id} className="flex items-center gap-2 text-sm">
                            <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">{(s.user?.name ?? '?').slice(0,2).toUpperCase()}</div>
                            <div className="min-w-0"><p className="font-medium truncate text-sm leading-none">{s.user?.name ?? '-'}</p><p className="text-xs text-slate-500">{s.rollNumber ?? s.roll_number} · {s.branch}</p></div>
                          </div>
                        ))}
                        {r.students.length>3 && <p className="text-xs text-slate-500">+{r.students.length-3} more</p>}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={()=> setViewRoom(r)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50 flex items-center justify-center gap-1"><Eye size={14}/> View</button>
                    <button onClick={()=> openEdit(r)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50 flex items-center justify-center gap-1"><Pencil size={14}/> Edit</button>
                    <button onClick={()=> setDelId(r.id)} className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center"><Trash2 size={14}/></button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mt-4"><Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></div>
        </>
      )}

      <Modal open={createOpen} onClose={()=> setCreateOpen(false)} title="Create room">
        {err && <div className="mb-3 rounded bg-white p-2 text-sm text-slate-700">{err}</div>}
        <form onSubmit={hsCreate(onCreate)} className="grid gap-4">
          <div><label className="mb-1 block text-sm font-medium">Room number</label><Input placeholder="e.g. A101" {...regCreate('roomNumber')}/>{errCreate.roomNumber && <p className="mt-1 text-xs text-slate-600">{errCreate.roomNumber.message}</p>}</div>
          <div><label className="mb-1 block text-sm font-medium">Block</label><Input placeholder="e.g. A" {...regCreate('block')}/>{errCreate.block && <p className="mt-1 text-xs text-slate-600">{errCreate.block.message}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Floor</label><Input type="number" placeholder="1" {...regCreate('floor')}/>{errCreate.floor && <p className="mt-1 text-xs text-slate-600">{errCreate.floor.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium">Capacity</label><Input type="number" placeholder="4" {...regCreate('capacity')}/>{errCreate.capacity && <p className="mt-1 text-xs text-slate-600">{errCreate.capacity.message}</p>}</div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={()=> setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createMut.isPending}>{createMut.isPending? 'Creating...':'Create'}</Button></div>
        </form>
      </Modal>

      <Modal open={!!editRoom} onClose={()=> setEditRoom(null)} title={editRoom? `Edit ${editRoom.roomNumber}`:'Edit room'}>
        {err && <div className="mb-3 rounded bg-white p-2 text-sm text-slate-700">{err}</div>}
        <form onSubmit={hsEdit(onEdit)} className="grid gap-4">
          <div><label className="mb-1 block text-sm font-medium">Room number</label><Input value={editRoom?.roomNumber ?? ''} disabled className="bg-gray-50"/><p className="text-xs text-gray-400 mt-1">Room number cannot be changed</p></div>
          <div><label className="mb-1 block text-sm font-medium">Block</label><Input {...regEdit('block')}/>{errEdit.block && <p className="mt-1 text-xs text-slate-600">{errEdit.block.message}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Floor</label><Input type="number" {...regEdit('floor')}/>{errEdit.floor && <p className="mt-1 text-xs text-slate-600">{errEdit.floor.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium">Capacity</label><Input type="number" {...regEdit('capacity')}/>{errEdit.capacity && <p className="mt-1 text-xs text-slate-600">{errEdit.capacity.message}</p>}</div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={()=> setEditRoom(null)}>Cancel</Button><Button type="submit" disabled={updateMut.isPending}>{updateMut.isPending? 'Saving...':'Save changes'}</Button></div>
        </form>
      </Modal>

      <Modal open={!!viewRoom} onClose={()=> setViewRoom(null)} title={viewRoom? `${viewRoom.roomNumber} — Details`:'Room details'}>
        {viewRoom && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Block:</span> <span className="font-medium">{viewRoom.block}</span></div>
              <div><span className="text-gray-500">Floor:</span> <span className="font-medium">{viewRoom.floor}</span></div>
              <div><span className="text-gray-500">Capacity:</span> <span className="font-medium">{viewRoom.capacity}</span></div>
              <div><span className="text-gray-500">Occupied:</span> <span className="font-medium">{viewRoom.occupied}</span></div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-white0" style={{width:`${viewRoom.capacity? Math.round(viewRoom.occupied/viewRoom.capacity*100):0}%`}}/></div>
            <div><h4 className="font-semibold text-sm mb-2">Occupants ({viewRoom.students?.length ?? viewRoom.occupied})</h4>
              {(!viewRoom.students || viewRoom.students.length===0)? <p className="text-sm text-gray-500">No students allocated.</p>:
                <div className="divide-y border rounded-lg overflow-hidden">{viewRoom.students.map((s:any)=> <div key={s.id} className="p-3 flex justify-between text-sm"><div><p className="font-medium">{s.user?.name ?? '-'}</p><p className="text-xs text-gray-500">{s.user?.email ?? ''} · {s.branch} · Year {s.year}</p></div><span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded h-fit">{s.rollNumber ?? s.roll_number ?? ''}</span></div>)}</div>
              }
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={delId!==null} onClose={()=> setDelId(null)} onConfirm={()=> { if(delId) removeMut.mutate(delId); setDelId(null)}} title="Delete room?" desc="This cannot be undone. Rooms with occupants should be emptied first."/>
    </div>
  )
}
