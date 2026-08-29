import { api } from './client'
import type { OutingOut, CreateOutingDto } from '../types'

function normOuting(a:any): OutingOut {
  return {
    id: a.id,
    studentId: a.studentId ?? a.student_id,
    destination: a.destination ?? '',
    reason: a.reason ?? '',
    outingDate: (a.outingDate ?? a.outing_date ?? '').toString().slice(0,10),
    outTime: a.outTime ?? a.out_time ?? '',
    inTime: a.inTime ?? a.in_time ?? '',
    status: (a.status ?? '').toString().toUpperCase() as any,
    createdAt: a.createdAt ?? a.created_at ?? undefined,
  } as any
}

export const outingsApi = {
  list: () => api.get<any[]>('/api/v1/outings').then((r) => r.data.map(normOuting)),
  get: (id: number) => api.get<any>(`/api/v1/outings/${id}`).then((r) => normOuting(r.data)),
  create: (dto: CreateOutingDto) => api.post<any>('/api/v1/outings', dto).then((r) => normOuting(r.data)),
  approve: (id: number) => api.patch<any>(`/api/v1/outings/${id}/approve`).then((r) => normOuting(r.data)),
  reject: (id: number) => api.patch<any>(`/api/v1/outings/${id}/reject`).then((r) => normOuting(r.data)),
}
