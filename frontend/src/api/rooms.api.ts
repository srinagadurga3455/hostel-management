import { api } from './client'
import type { RoomOut, CreateRoomDto, UpdateRoomDto } from '../types'
export const roomsApi = {
  list: () => api.get<RoomOut[]>('/api/v1/rooms').then((r) => r.data),
  get: (id: number) => api.get<RoomOut>(`/api/v1/rooms/${id}`).then((r) => r.data),
  create: (dto: CreateRoomDto) => api.post<RoomOut>('/api/v1/rooms', dto).then((r) => r.data),
  update: (id: number, dto: UpdateRoomDto) => api.patch<RoomOut>(`/api/v1/rooms/${id}`, dto).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/v1/rooms/${id}`).then((r) => r.data),
}
