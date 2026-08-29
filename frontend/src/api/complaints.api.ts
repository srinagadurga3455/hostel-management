import { api } from './client'
import type { ComplaintOut, CreateComplaintDto, UpdateComplaintStatusDto } from '../types'

function normComplaint(a:any): ComplaintOut {
  return {
    id: a.id,
    studentId: a.studentId ?? a.student_id,
    title: a.title ?? '',
    description: a.description ?? '',
    status: (a.status ?? '').toString().toUpperCase() as any,
    createdAt: a.createdAt ?? a.created_at ?? a.createdAt ?? undefined,
    updatedAt: a.updatedAt ?? a.updated_at ?? undefined,
  } as any
}

export const complaintsApi = {
  list: () => api.get<any[]>('/api/v1/complaints').then((r) => r.data.map(normComplaint)),
  create: (dto: CreateComplaintDto) => api.post<any>('/api/v1/complaints', dto).then((r) => normComplaint(r.data)),
  get: (id: number) => api.get<any>(`/api/v1/complaints/${id}`).then((r) => normComplaint(r.data)),
  updateStatus: (id: number, dto: UpdateComplaintStatusDto) => api.patch<any>(`/api/v1/complaints/${id}`, dto).then((r) => normComplaint(r.data)),
}
