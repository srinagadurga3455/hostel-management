import { api } from './client'
import type { AttendanceOut, CreateAttendanceDto, UpdateAttendanceDto } from '../types'

function norm(a: any): AttendanceOut {
  return {
    id: a.id,
    studentId: a.studentId ?? a.student_id,
    date: typeof a.date === 'string' ? a.date.slice(0, 10) : String(a.date).slice(0, 10),
    status: a.status,
  } as AttendanceOut
}

export const attendanceApi = {
  list: () => api.get<any[]>('/api/v1/attendance').then((r) => r.data.map(norm)),
  create: (dto: CreateAttendanceDto) => api.post<any>('/api/v1/attendance', dto).then((r) => norm(r.data)),
  byStudent: (id: number) => api.get<any[]>(`/api/v1/attendance/student/${id}`).then((r) => r.data.map(norm)),
  update: (id: number, dto: UpdateAttendanceDto) => api.patch<any>(`/api/v1/attendance/${id}`, dto).then((r) => norm(r.data)),
}
