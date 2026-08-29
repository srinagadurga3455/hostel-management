import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { foodApi } from '../../api/food.api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Pagination } from '../../components/ui/Pagination'
import { getErrorMessage } from '../../api/client'
import { useState, useMemo, useEffect } from 'react'
import { Utensils, Coffee, Soup, Cookie, Moon, Pencil, Trash2, Search, Plus, Copy, ChefHat, CalendarDays } from 'lucide-react'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'] as const
type Day = typeof DAYS[number]
const dayLabel: Record<Day,string> = { MONDAY:'Monday', TUESDAY:'Tuesday', WEDNESDAY:'Wednesday', THURSDAY:'Thursday', FRIDAY:'Friday', SATURDAY:'Saturday', SUNDAY:'Sunday' }
const dayShort: Record<Day,string> = { MONDAY:'MON', TUESDAY:'TUE', WEDNESDAY:'WED', THURSDAY:'THU', FRIDAY:'FRI', SATURDAY:'SAT', SUNDAY:'SUN' }
const jsToday = () => ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date().getDay()] as Day

const schema = z.object({ day: z.enum(DAYS), breakfast: z.string().min(1,'Required'), lunch: z.string().min(1,'Required'), snacks: z.string().min(1,'Required'), dinner: z.string().min(1,'Required') })
type Form = z.infer<typeof schema>
const editSchema = z.object({ breakfast: z.string().min(1,'Required'), lunch: z.string().min(1,'Required'), snacks: z.string().min(1,'Required'), dinner: z.string().min(1,'Required') })
type EditForm = z.infer<typeof editSchema>
const PAGE_SIZE = 6

export default function WardenFood() {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState<Day | 'ALL'>('ALL')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const todayDay = jsToday()

  const { data, isLoading, error } = useQuery({ queryKey: ['food'], queryFn: foodApi.list })
  const { register, handleSubmit, reset, watch, setValue, formState:{ errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues:{ day: 'MONDAY' as Day } as any })
  const { register: regEdit, handleSubmit: hsEdit, reset: resetEdit, formState:{ errors: eErr } } = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2200) }

  const create = useMutation({
    mutationFn: foodApi.create,
    onSuccess: (c)=>{ qc.setQueryData(['food'], (old:any)=> old? [...old,c]:[c]); qc.invalidateQueries({queryKey:['food']}); reset(); setCreateOpen(false); showToast('Menu added'); setErr('') },
    onError:(e)=>setErr(getErrorMessage(e)),
  })
  const update = useMutation({
    mutationFn: ({id,dto}:{id:number,dto:any})=> foodApi.update(id,dto),
    onSuccess:(u)=>{ qc.setQueryData(['food'], (old:any)=> old?.map((x:any)=> x.id===u.id? u:x)); qc.invalidateQueries({queryKey:['food']}); setEditItem(null); showToast('Menu updated') },
    onError:(e)=>setErr(getErrorMessage(e)),
  })
  const del = useMutation({
    mutationFn: foodApi.remove,
    onSuccess:(_, id)=>{ qc.setQueryData(['food'], (old:any)=> old?.filter((x:any)=> x.id!==id)); qc.invalidateQueries({queryKey:['food']}); showToast('Menu deleted') },
  })

  const byDay = useMemo(()=>{
    const m = new Map<Day, any>()
    data?.forEach(x=> m.set(x.day as Day, x))
    return m
  },[data])

  const stats = useMemo(()=>{
    const total = DAYS.length
    const configured = byDay.size
    const missing = DAYS.filter(d=> !byDay.has(d))
    return { total, configured, missing, coverage: Math.round(configured/total*100) }
  },[byDay])

  const filtered = useMemo(()=>{
    if(!data) return []
    return data.filter(m=>{
      if(search && !`${m.day} ${m.breakfast} ${m.lunch} ${m.snacks} ${m.dinner}`.toLowerCase().includes(search.toLowerCase())) return false
      if(dayFilter!=='ALL' && m.day!==dayFilter) return false
      return true
    })
  },[data,search,dayFilter])

  useEffect(()=> setPage(1),[search,dayFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE))
  const paginated = useMemo(()=> filtered.slice((Math.min(page,totalPages)-1)*PAGE_SIZE, Math.min(page,totalPages)*PAGE_SIZE),[filtered,page,totalPages])
  useEffect(()=>{ if(page>totalPages) setPage(totalPages)},[page,totalPages])

  const openEdit = (item:any)=>{ setEditItem(item); resetEdit({ breakfast:item.breakfast, lunch:item.lunch, snacks:item.snacks, dinner:item.dinner }); setErr('') }
  const onCreate = (v:Form)=>{ setErr(''); create.mutate(v as any) }
  const onEdit = (v:EditForm)=>{ if(!editItem) return; update.mutate({id:editItem.id, dto:v}) }
  const onCopy = (from:Day)=>{
    const src = byDay.get(from)
    if(!src){ showToast('No menu to copy'); return }
    setCreateOpen(true); reset({ day: from, breakfast: src.breakfast, lunch: src.lunch, snacks: src.snacks, dinner: src.dinner } as any)
  }

  const daysInOrder = dayFilter==='ALL' ? DAYS : [dayFilter as Day]

  return (
    <div className="space-y-5">
      <PageHeader title="Food Menu" desc="Weekly mess plan — today highlighted, missing days flagged" />
      {err && <div className="rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-700">{err}</div>}
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm shadow-lg">{toast}</div>}

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center"><ChefHat size={18} className="text-slate-600"/></div>
          <div><p className="text-xs text-slate-500">Week coverage</p><p className="text-base font-semibold tracking-tight">{stats.configured}/7</p><div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mt-1"><div className="h-full bg-white0" style={{width:`${stats.coverage}%`}}/></div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-slate-500">Today</p><p className="text-lg font-semibold flex items-center gap-2"><CalendarDays size={16} className="text-indigo-500"/>{dayLabel[todayDay]}</p><p className="text-xs text-slate-400 truncate">{byDay.get(todayDay)?.dinner ?? 'Not set'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-slate-500">Configured</p><p className="text-base font-semibold tracking-tight text-slate-900">{stats.configured}</p><p className="text-xs text-slate-400">days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-slate-500">Missing</p><p className="text-base font-semibold tracking-tight text-slate-600">{stats.missing.length}</p><p className="text-xs text-slate-400 truncate">{stats.missing.map(d=> dayShort[d]).join(', ') || '—'}</p>
        </div>
      </div>

      {/* toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
          <Input placeholder="Search meal or day..." value={search} onChange={e=> setSearch(e.target.value)} className="pl-9"/>
        </div>
        <select value={dayFilter} onChange={e=> setDayFilter(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All days</option>{DAYS.map(d=> <option key={d} value={d}>{dayLabel[d]}</option>)}
        </select>
        <div className="flex rounded-full border border-slate-200 overflow-hidden ml-auto sm:ml-0">
          <button onClick={()=> setViewMode('board')} className={`px-4 py-2 text-xs font-medium ${viewMode==='board'? 'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}>Board</button>
          <button onClick={()=> setViewMode('list')} className={`px-4 py-2 text-xs font-medium ${viewMode==='list'? 'bg-slate-900 text-white':'bg-white hover:bg-slate-50'}`}>List</button>
        </div>
        <Button onClick={()=> { reset({ day:'MONDAY' as Day, breakfast:'', lunch:'', snacks:'', dinner:''} as any); setErr(''); setCreateOpen(true)}} className="gap-1"><Plus size={16}/> Add menu</Button>
      </div>

      {isLoading ? <div className="flex justify-center p-8"><Spinner/></div> : error ? <ErrorState message={getErrorMessage(error)}/> : viewMode==='board' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {daysInOrder.map(day=>{
              const item = byDay.get(day)
              const isToday = day===todayDay
              if(!item){
                if(search) return null // hide missing when searching
                return (
                  <div key={day} className={`rounded-xl border-2 border-dashed p-5 bg-white ${isToday? 'border-slate-200 bg-white': 'border-slate-200'}`}>
                    <div className="flex items-center justify-between"><p className="font-semibold flex items-center gap-2">{dayShort[day]} <span className="font-normal text-slate-500 text-sm">{dayLabel[day]}</span>{isToday && <span className="rounded-full bg-white0 text-white px-2 py-0.5 text-[10px] font-semibold">TODAY</span>}</p><span className="rounded-full bg-white border border-slate-200 px-2 py-1 text-xs text-slate-600">Missing</span></div>
                    <p className="text-sm text-slate-400 mt-3">No menu set for this day.</p>
                    <Button variant="outline" className="mt-4 w-full" onClick={()=> { reset({ day, breakfast:'', lunch:'', snacks:'', dinner:''} as any); setCreateOpen(true)}}><Plus size={14} className="mr-1"/> Set menu</Button>
                  </div>
                )
              }
              if(search && !`${item.day} ${item.breakfast} ${item.lunch} ${item.snacks} ${item.dinner}`.toLowerCase().includes(search.toLowerCase())) return null
              return (
                <div key={item.id} className={`rounded-xl border p-5 bg-white shadow-sm hover:border-slate-300 transition relative overflow-hidden ${isToday? 'border-slate-200 ': 'border-slate-100'}`}>
                  
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-xs tracking-widest font-semibold text-slate-400">{dayShort[item.day as Day]}</p><p className="font-semibold text-slate-900 flex items-center gap-2">{dayLabel[item.day as Day]}{isToday && <span className="rounded-full bg-white0 text-white px-2 py-0.5 text-[10px] font-semibold">TODAY</span>}</p></div>
                    <div className="flex gap-1">
                      <button onClick={()=> openEdit(item)} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><Pencil size={14}/></button>
                      <button onClick={()=> setDeleteId(item.id)} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-red-100 text-slate-600"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-[11px] font-medium tracking-wide text-slate-500 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400"></span> BREAKFAST</p><p className="text-sm font-medium mt-1 line-clamp-2">{item.breakfast}</p></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-[11px] font-medium tracking-wide text-slate-500 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400"></span> LUNCH</p><p className="text-sm font-medium mt-1 line-clamp-2">{item.lunch}</p></div>
                    <div className="rounded-xl bg-white border border-slate-200 p-3"><p className="text-[11px] font-semibold tracking-wide text-slate-700 flex items-center gap-1"><Cookie size={12}/> SNACKS</p><p className="text-sm font-medium mt-1 line-clamp-2">{item.snacks}</p></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-[11px] font-medium tracking-wide text-slate-500 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400"></span> DINNER</p><p className="text-sm font-medium mt-1 line-clamp-2">{item.dinner}</p></div>
                  </div>
                  <button onClick={()=> onCopy(item.day as Day)} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50 flex items-center justify-center gap-1"><Copy size={12}/> Duplicate</button>
                </div>
              )
            })}
          </div>
          {!data?.length && <div className="mt-6"><EmptyState title="No menus yet — set Monday to get started"/></div>}
        </>
      ) : (
        <>
          {!filtered.length ? <EmptyState title={data?.length? 'No menus match filters':'No menus'}/> : (
            <>
              <div className="grid gap-3">
                {paginated.map(m=> (
                  <div key={m.id} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-4 items-start">
                    <div className="min-w-[120px]">
                      <p className="text-xs tracking-widest font-semibold text-slate-400">{dayShort[m.day as Day]}</p>
                      <p className="font-semibold">{dayLabel[m.day as Day]}</p>
                      {m.day===todayDay && <span className="rounded-full bg-white0 text-white px-2 py-0.5 text-[10px] font-semibold">TODAY</span>}
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <span><b className="text-slate-600 flex items-center gap-1"><Coffee size={12}/>B:</b> {m.breakfast}</span>
                      <span><b className="text-slate-600 flex items-center gap-1"><Soup size={12}/>L:</b> {m.lunch}</span>
                      <span><b className="text-slate-600 flex items-center gap-1"><Cookie size={12}/>S:</b> {m.snacks}</span>
                      <span><b className="text-slate-600 flex items-center gap-1"><Moon size={12}/>D:</b> {m.dinner}</span>
                    </div>
                    <div className="flex gap-1 ml-auto">
                      <button onClick={()=> openEdit(m)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50">Edit</button>
                      <button onClick={()=> setDeleteId(m.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-red-100">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border bg-white"><Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage}/></div>
            </>
          )}
        </>
      )}

      {/* create */}
      <Modal open={createOpen} onClose={()=> setCreateOpen(false)} title="Add menu">
        {err && <div className="mb-3 rounded bg-white p-2 text-sm text-slate-700">{err}</div>}
        <form onSubmit={handleSubmit(onCreate)} className="grid gap-4">
          <div><label className="mb-1 block text-sm font-medium">Day</label><Select {...register('day')}><option value="">Select day</option>{DAYS.map(d=> <option key={d} value={d}>{dayLabel[d]}</option>)}</Select>{errors.day && <p className="text-xs text-slate-600 mt-1">{errors.day.message}</p>}</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium flex items-center gap-1"><Coffee size={14}/> Breakfast</label><Input placeholder="Idli, Dosa..." {...register('breakfast')}/>{errors.breakfast && <p className="text-xs text-slate-600 mt-1">{errors.breakfast.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium flex items-center gap-1"><Soup size={14}/> Lunch</label><Input placeholder="Rice, Curry..." {...register('lunch')}/>{errors.lunch && <p className="text-xs text-slate-600 mt-1">{errors.lunch.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium flex items-center gap-1"><Cookie size={14}/> Snacks</label><Input placeholder="Samosa, Tea..." {...register('snacks')}/>{errors.snacks && <p className="text-xs text-slate-600 mt-1">{errors.snacks.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium flex items-center gap-1"><Moon size={14}/> Dinner</label><Input placeholder="Chapati..." {...register('dinner')}/>{errors.dinner && <p className="text-xs text-slate-600 mt-1">{errors.dinner.message}</p>}</div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={()=> setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending? 'Adding...':'Add menu'}</Button></div>
        </form>
      </Modal>

      {/* edit */}
      <Modal open={!!editItem} onClose={()=> setEditItem(null)} title={editItem? `Edit ${dayLabel[editItem.day as Day]}`:'Edit menu'}>
        {err && <div className="mb-3 rounded bg-white p-2 text-sm text-slate-700">{err}</div>}
        <form onSubmit={hsEdit(onEdit)} className="grid gap-4">
          <div className="rounded-lg bg-slate-50 border p-3 text-sm flex items-center gap-2"><Utensils size={14}/>{editItem && dayLabel[editItem.day as Day]} — {editItem && dayShort[editItem.day as Day]}</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Breakfast</label><Input {...regEdit('breakfast')}/>{eErr.breakfast && <p className="text-xs text-slate-600 mt-1">{eErr.breakfast.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium">Lunch</label><Input {...regEdit('lunch')}/>{eErr.lunch && <p className="text-xs text-slate-600 mt-1">{eErr.lunch.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium">Snacks</label><Input {...regEdit('snacks')}/>{eErr.snacks && <p className="text-xs text-slate-600 mt-1">{eErr.snacks.message}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium">Dinner</label><Input {...regEdit('dinner')}/>{eErr.dinner && <p className="text-xs text-slate-600 mt-1">{eErr.dinner.message}</p>}</div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={()=> setEditItem(null)}>Cancel</Button><Button type="submit" disabled={update.isPending}>{update.isPending? 'Saving...':'Save changes'}</Button></div>
        </form>
      </Modal>

      {/* delete confirm */}
      <Modal open={deleteId!==null} onClose={()=> setDeleteId(null)} title="Delete menu?">
        <p className="text-sm text-slate-600">This will remove the menu for this day. You can re-add it anytime.</p>
        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={()=> setDeleteId(null)}>Cancel</Button><Button className="bg-slate-900 hover:bg-slate-800" onClick={()=> { if(deleteId) del.mutate(deleteId); setDeleteId(null)}}>Delete</Button></div>
      </Modal>
    </div>
  )
}
