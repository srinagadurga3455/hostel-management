import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL as string | undefined
if (!baseURL) console.warn('VITE_API_URL not set')

export const api = axios.create({
  baseURL: baseURL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status as number | undefined
    const data = error?.response?.data as { detail?: unknown }
    let message = 'Something went wrong'
    if (typeof data?.detail === 'string') message = data.detail
    else if (Array.isArray(data?.detail)) message = (data.detail as { msg: string }[]).map((d) => d.msg).join(', ')
    else if (error.message) message = error.message

    if (status === 401) {
      localStorage.removeItem('token')
      if (location.pathname !== '/login') location.href = '/login'
    }
    // attach friendly message
    error.friendlyMessage = message
    return Promise.reject(error)
  },
)

export function getErrorMessage(err: unknown): string {
  const e = err as { friendlyMessage?: string; response?: { data?: { detail?: unknown } }; message?: string }
  if (e.friendlyMessage) return e.friendlyMessage
  const d = e.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return (d as { msg: string }[]).map((x) => x.msg).join(', ')
  return e.message ?? 'Unexpected error'
}
