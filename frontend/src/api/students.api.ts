import { api } from './client'
import type { StudentOut, UpdateStudentDto } from '../types'
export const studentsApi = {
  list: () => api.get<StudentOut[]>('/api/v1/students').then((r) => r.data),
  get: (id: number) => api.get<StudentOut>(`/api/v1/students/${id}`).then((r) => r.data),
  update: (id: number, dto: UpdateStudentDto) => api.patch<StudentOut>(`/api/v1/students/${id}`, dto).then((r) => r.data),
  assignRoom: (id: number, roomId: number) => api.patch(`/api/v1/students/${id}/room`, { roomId }).then((r) => r.data),
}
