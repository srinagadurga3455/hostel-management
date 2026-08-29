import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi } from '../../api/students.api'
import { roomsApi } from '../../api/rooms.api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { getErrorMessage } from '../../api/client'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { useState, useMemo, useEffect } from 'react'

const PAGE_SIZE = 10

export default function WardenStudents() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['students'], queryFn: studentsApi.list })
  const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: roomsApi.list })
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL')
  const [page, setPage] = useState(1)

  const mut = useMutation({
    mutationFn: ({ id, roomId }: { id: number; roomId: number }) => studentsApi.assignRoom(id, roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (e) => setErr(getErrorMessage(e)),
  })

  const branches = useMemo(() => Array.from(new Set((data ?? []).map((s) => s.branch))).sort(), [data])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        if (!`${s.user.name} ${s.rollNumber} ${s.branch}`.toLowerCase().includes(q)) return false
      }
      if (branchFilter !== 'ALL' && s.branch !== branchFilter) return false
      if (yearFilter !== 'ALL' && String(s.year) !== yearFilter) return false
      if (roomFilter === 'ASSIGNED' && !s.roomId) return false
      if (roomFilter === 'UNASSIGNED' && s.roomId) return false
      return true
    })
  }, [data, search, branchFilter, yearFilter, roomFilter])

  useEffect(() => setPage(1), [search, branchFilter, yearFilter, roomFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const p = Math.min(page, totalPages)
    return filtered.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
  }, [filtered, page, totalPages])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>
  if (error) return <ErrorState message={getErrorMessage(error)} />
  if (!data?.length) return <><PageHeader title="Students" /><EmptyState title="No students" /></>

  return (
    <div>
      <PageHeader title="Students" desc="All registered students" />
      {err && <div className="mb-3 rounded bg-white p-2 text-sm text-slate-700">{err}</div>}

      <div className="mb-4 flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-100 p-4">
        <Input placeholder="Search name, roll, branch..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All branches</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All years</option>
          <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
        </select>
        <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value as never)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All rooms</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="UNASSIGNED">Unassigned</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} of {data.length} students</span>
      </div>

      {!filtered.length ? (
        <EmptyState title="No students match filters" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3">Roll</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Assign</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.user.name}</td>
                    <td className="p-3 text-center">{s.rollNumber}</td>
                    <td className="p-3 text-center">{s.branch}</td>
                    <td className="p-3 text-center">{s.year}</td>
                    <td className="p-3 text-center">{s.room?.roomNumber ?? '-'}</td>
                    <td className="p-3">
                      <Select
                        defaultValue={s.roomId ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          if (v) mut.mutate({ id: s.id, roomId: v })
                        }}
                      >
                        <option value="">Select room</option>
                        {rooms?.map((r) => {
                          const vacancies = Math.max(0, r.capacity - r.occupied)
                          const isFull = vacancies <= 0
                          const isCurrent = s.roomId === r.id
                          return (
                            <option key={r.id} value={r.id} disabled={isFull && !isCurrent}>
                              {r.roomNumber} ({r.block}) — {vacancies} {vacancies === 1 ? 'vacancy' : 'vacancies'} ({r.occupied}/{r.capacity}){isFull && !isCurrent ? ' — Full' : ''}
                            </option>
                          )
                        })}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
