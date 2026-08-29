import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export function RoleRoute({ allow, children }: { allow: string[]; children: React.ReactNode }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  if (!allow.includes(role)) {
    return <Navigate to={role === 'warden' ? '/warden' : '/student'} replace />
  }
  return <>{children}</>
}
