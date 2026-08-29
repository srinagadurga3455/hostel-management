import { api } from './client'
import type { LeaveOut, CreateLeaveDto } from '../types'

function normLeave(a:any): LeaveOut {
  return {
    id: a.id,
    studentId: a.studentId ?? a.student_id,
    startDate: (a.startDate ?? a.start_date ?? '').toString().slice(0,10),
    endDate: (a.endDate ?? a.end_date ?? '').toString().slice(0,10),
    reason: a.reason ?? '',
    status: (a.status ?? '').toString().toUpperCase() as any,
    createdAt: a.createdAt ?? a.created_at ?? undefined,
  } as any
}

export const leavesApi = {
  list: () => api.get<any[]>('/api/v1/leaves').then((r) => r.data.map(normLeave)),
  get: (id: number) => api.get<any>(`/api/v1/leaves/${id}`).then((r) => normLeave(r.data)),
  create: (dto: CreateLeaveDto) => api.post<any>('/api/v1/leaves', dto).then((r) => normLeave(r.data)),
  approve: (id: number) => api.patch<any>(`/api/v1/leaves/${id}/approve`).then((r) => normLeave(r.data)),
  reject: (id: number) => api.patch<any>(`/api/v1/leaves/${id}/reject`).then((r) => normLeave(r.data)),
  cancel: (id: number) => api.patch<any>(`/api/v1/leaves/${id}/cancel`).then((r) => normLeave(r.data)),
}
