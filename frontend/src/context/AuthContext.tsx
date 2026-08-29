import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users.api'
import { authApi } from '../api/auth.api'
import type { UserOut } from '../types'

interface AuthCtx {
  user: UserOut | null | undefined
  isLoading: boolean
  isAuthenticated: boolean
  role: string | undefined
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
    enabled: !!token,
    retry: false,
  })

  const value = useMemo<AuthCtx>(
    () => ({
      user: user ?? null,
      isLoading: !!token && isLoading,
      isAuthenticated: !!token && !!user,
      role: user?.role,
      login: async (email, password) => {
        const res = await authApi.login({ email, password })
        localStorage.setItem('token', res.token)
        qc.setQueryData(['me'], res.user)
        await qc.invalidateQueries({ queryKey: ['me'] })
      },
      logout: () => {
        localStorage.removeItem('token')
        qc.clear()
        location.href = '/login'
      },
    }),
    [user, isLoading, token, qc],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
