import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })
type Form = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: Form) => {
    setErr('')
    try {
      await login(v.email, v.password)
      const token = localStorage.getItem('token')
      // role routing: fetch me is cached, infer via login response stored? fallback to warden/student check via /me already. Use quick decode not needed; navigate based on role query after login.
      // Simple: try to read role from query cache or redirect to /student then RoleRoute will redirect warden correctly via /me.
      // We fetch me via auth context; to decide now, we can just redirect to generic and let Protected handle.
      // Better: decode token payload quickly to get role if present, else go to /student.
      // We'll just navigate to /student or /warden based on login call that stored user.
      // Retrieve from local? Use users/me after.
      // For now navigate to /student; RoleRoute will bounce warden to /warden on layout mount but we can attempt both.
      // Let's just navigate to / and let AppRoutes handle root? Instead check role via direct API call.
      const { usersApi } = await import('../../api/users.api')
      const me = await usersApi.me()
      nav(me.role === 'warden' ? '/warden' : '/student', { replace: true })
      void token
    } catch (e) { setErr(getErrorMessage(e)) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold">HostelOS — Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your hostel account</p>
        {err && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div><label className="text-sm font-medium">Email</label><Input {...register('email')} placeholder="you@hostel.com" /><p className="text-xs text-red-600">{errors.email?.message}</p></div>
          <div><label className="text-sm font-medium">Password</label><Input type="password" {...register('password')} /><p className="text-xs text-red-600">{errors.password?.message}</p></div>
          <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Signing in...' : 'Sign in'}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">No account? <Link to="/register" className="text-indigo-600 underline">Register</Link></p>
      </Card>
    </div>
  )
}
