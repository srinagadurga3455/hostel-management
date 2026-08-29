import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { outingsApi } from '../../api/outings.api'
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
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  outingDate: z.string().min(1, 'Outing date is required'),
  outTime: z.string().min(1, 'Out time is required'),
  inTime: z.string().min(1, 'In time is required'),
})
type Form = z.infer<typeof schema>

export default function StudentOutings() {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)
  const { data, isLoading, error } = useQuery({ queryKey: ['outings'], queryFn: outingsApi.list })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })
  const mut = useMutation({
    mutationFn: outingsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outings'] })
      reset()
      setErr('')
      setOpen(false)
    },
    onError: (e) => setErr(getErrorMessage(e)),
  })

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase()
    if (s === 'APPROVED') return 'text-green-600 bg-green-50'
    if (s === 'REJECTED') return 'text-red-600 bg-red-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  const formatStatus = (status: string) => {
    const s = status?.toUpperCase()
    if (s === 'APPROVED') return 'Approved'
    if (s === 'REJECTED') return 'Rejected'
    return 'Pending'
  }

  const onSubmit = (v: Form) => {
    setErr('')
    mut.mutate(v)
  }

  const handleClose = () => {
    setOpen(false)
    setErr('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Outings</h1>
          <p className="text-gray-600 text-sm">Your outing requests and history.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Create Outing</Button>
      </div>

      <Modal open={open} onClose={handleClose} title="Request outing">
        {err && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Destination</label>
            <Input placeholder="e.g. Chennai Central Mall" {...register('destination')} />
            {errors.destination && <p className="mt-1 text-xs text-red-600">{errors.destination.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Outing Date</label>
            <Input type="date" {...register('outingDate')} />
            {errors.outingDate && <p className="mt-1 text-xs text-red-600">{errors.outingDate.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Out Time</label>
              <Input type="time" {...register('outTime')} />
              {errors.outTime && <p className="mt-1 text-xs text-red-600">{errors.outTime.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">In Time (Expected Return)</label>
              <Input type="time" {...register('inTime')} />
              {errors.inTime && <p className="mt-1 text-xs text-red-600">{errors.inTime.message}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
            <Textarea placeholder="Reason for outing" rows={3} {...register('reason')} />
            {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? 'Submitting...' : 'Submit request'}
            </Button>
          </div>
        </form>
      </Modal>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} />
      ) : !data?.length ? (
        <EmptyState title="No outings yet" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  DESTINATION
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">OUT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RETURN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((o: any) => {
                const outingDate = o.outingDate ?? o.outing_date ?? ''
                const outTime = o.outTime ?? o.out_time ?? ''
                const inTime = o.inTime ?? o.in_time ?? ''
                const status = o.status ?? 'PENDING'
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.destination}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {outingDate ? String(outingDate).split('T')[0] : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{outTime || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inTime || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${status?.toUpperCase() === 'APPROVED' ? 'bg-green-500' : status?.toUpperCase() === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'}`}
                        ></span>
                        {formatStatus(status)}
                      </span>
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


