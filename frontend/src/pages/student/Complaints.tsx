import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { complaintsApi } from '../../api/complaints.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Modal } from '../../components/ui/Modal'
import { getErrorMessage } from '../../api/client'
import { useState } from 'react'

const schema = z.object({ title: z.string().min(3, 'Title must be at least 3 characters'), description: z.string().min(10, 'Description must be at least 10 characters') })
type Form = z.infer<typeof schema>

export default function StudentComplaints() {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)
  const { data, isLoading, error } = useQuery({ queryKey: ['complaints'], queryFn: complaintsApi.list })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })
  const mut = useMutation({
    mutationFn: complaintsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] })
      reset()
      setErr('')
      setOpen(false)
    },
    onError: (e) => setErr(getErrorMessage(e)),
  })
  const onSubmit = (v: Form) => { setErr(''); mut.mutate(v) }

  const handleClose = () => {
    setOpen(false)
    setErr('')
    reset()
  }

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase()
    if (s === 'RESOLVED') return 'text-green-600 bg-green-50'
    if (s === 'IN_PROGRESS') return 'text-blue-600 bg-blue-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  const getCategoryFromTitle = (title: string) => {
    const lower = title.toLowerCase()
    if (lower.includes('plumb') || lower.includes('tap') || lower.includes('water')) return 'Plumbing'
    if (lower.includes('electric') || lower.includes('fan') || lower.includes('light')) return 'Electrical'
    return 'General'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Complaints</h1>
          <p className="text-gray-600 text-sm">Track issues you've reported.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Create</Button>
      </div>

      <Modal open={open} onClose={handleClose} title="Create Complaint">
        {err && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <Input placeholder="e.g. Water problem in room" {...register('title')} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <Textarea placeholder="Describe the issue in detail (min 10 characters)" rows={4} {...register('description')} />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? 'Submitting...' : 'Submit'}</Button>
          </div>
        </form>
      </Modal>

      {isLoading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} />
      ) : !data?.length ? (
        <EmptyState title="No complaints yet" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CATEGORY</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CREATED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((c: any, idx: number) => {
                const createdAt = c.createdAt ?? c.created_at
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">CMP-{String(idx + 1000 + 842).slice(-4)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getCategoryFromTitle(c.title)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{c.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status?.toUpperCase() === 'RESOLVED' ? 'bg-green-500' : c.status?.toUpperCase() === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                        {c.status === 'RESOLVED' ? 'Resolved' : c.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{createdAt ? new Date(createdAt).toLocaleDateString() : '10 min ago'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
