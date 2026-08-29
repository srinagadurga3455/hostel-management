import { api } from './client'
import type { FoodMenuOut, CreateFoodMenuDto, UpdateFoodMenuDto } from '../types'
export const foodApi = {
  list: () => api.get<FoodMenuOut[]>('/api/v1/food-menu').then((r) => r.data),
  get: (id: number) => api.get<FoodMenuOut>(`/api/v1/food-menu/${id}`).then((r) => r.data),
  create: (dto: CreateFoodMenuDto) => api.post<FoodMenuOut>('/api/v1/food-menu', dto).then((r) => r.data),
  update: (id: number, dto: UpdateFoodMenuDto) => api.patch<FoodMenuOut>(`/api/v1/food-menu/${id}`, dto).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/v1/food-menu/${id}`).then((r) => r.data),
}
