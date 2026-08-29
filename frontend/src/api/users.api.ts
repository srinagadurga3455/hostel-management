import { api } from './client'
import type { UserOut } from '../types'
export const usersApi = {
  me: () => api.get<UserOut>('/api/v1/users/me').then((r) => r.data),
}
