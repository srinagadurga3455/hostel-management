import { api } from './client'
import type { LoginDto, RegisterDto, TokenResponse } from '../types'

export const authApi = {
  login: (dto: LoginDto) => api.post<TokenResponse>('/api/v1/auth/login', dto).then((r) => r.data),
  register: (dto: RegisterDto) => api.post<TokenResponse>('/api/v1/auth/register', dto).then((r) => r.data),
}
