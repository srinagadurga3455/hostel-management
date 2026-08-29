import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { leavesApi } from '../../api/leaves.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Modal } from '../../components/ui/Modal'
import { getErrorMessage } from '../../api/client'
import { useState } from 'react'

const schema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
})
type Form = z.infer<typeof schema>

export default function StudentLeaves() {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)
  const { data, isLoading, error } = useQuery({ queryKey: ['leaves'], queryFn: leavesApi.list })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const create = useMutation({
    mutationFn: leavesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      reset()
      setErr('')
      setOpen(false)
    },
    onError: (e) => setErr(getErrorMessage(e)),
  })

  const cancel = useMutation({
    mutationFn: (id: number) => leavesApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
    onError: (e) => setErr(getErrorMessage(e)),
  })

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase()
    if (s === 'APPROVED') return 'text-green-600 bg-green-50'
    if (s === 'REJECTED') return 'text-red-600 bg-red-50'
    if (s === 'CANCELLED') return 'text-gray-600 bg-gray-100'
    return 'text-yellow-600 bg-yellow-50'
  }

  const formatStatus = (status: string) => {
    const s = status?.toUpperCase()
    if (s === 'APPROVED') return 'Approved'
    if (s === 'REJECTED') return 'Rejected'
    if (s === 'CANCELLED') return 'Cancelled'
    return 'Pending'
  }

  const onSubmit = (v: Form) => {
    setErr('')
    create.mutate(v)
  }

  const handleClose = () => {
    setOpen(false)
    setErr('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Leaves</h1>
          <p className="text-gray-600 text-sm">Apply and manage your leaves.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Apply Leave</Button>
      </div>

      <Modal open={open} onClose={handleClose} title="Apply for leave">
        {err && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
            <Input type="date" {...register('startDate')} />
            {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
            <Input type="date" {...register('endDate')} />
            {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
            <Textarea placeholder="Reason for leave" rows={3} {...register('reason')} />
            {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </form>
      </Modal>

      {err && !open && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{err}</div>}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} />
      ) : !data?.length ? (
        <EmptyState title="No leaves yet" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">START</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">END</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">REASON</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((l: any) => {
                const status = l.status ?? 'PENDING'
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{String(l.startDate ?? '').slice(0, 10)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{String(l.endDate ?? '').slice(0, 10)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{l.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${status?.toUpperCase() === 'APPROVED' ? 'bg-green-500' : status?.toUpperCase() === 'REJECTED' ? 'bg-red-500' : status?.toUpperCase() === 'CANCELLED' ? 'bg-gray-500' : 'bg-yellow-500'}`}
                        ></span>
                        {formatStatus(status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {String(status).toUpperCase() === 'PENDING' ? (
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1"
                          onClick={() => cancel.mutate(l.id)}
                          disabled={cancel.isPending}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
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
