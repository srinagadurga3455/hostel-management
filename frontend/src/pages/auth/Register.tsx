import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/auth.api'
import { getErrorMessage } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'

const schema = z.object({
  name: z.string().min(2), email: z.string().email(), password: z.string().min(6), role: z.enum(['student', 'warden']),
  rollNumber: z.string().optional(), branch: z.string().optional(), year: z.coerce.number().optional(),
})
type Form = z.infer<typeof schema>

export default function Register() {
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { role: 'student' } })
  const role = watch('role')
  const onSubmit = async (v: Form) => {
    setErr('')
    try {
      const res = await authApi.register({ name: v.name, email: v.email, password: v.password, role: v.role as never, rollNumber: v.rollNumber || null, branch: v.branch || null, year: v.year || null })
      localStorage.setItem('token', res.token)
      nav(res.user.role === 'warden' ? '/warden' : '/student', { replace: true })
    } catch (e) { setErr(getErrorMessage(e)) }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Join HostelOS</p>
        {err && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div><label className="text-sm font-medium">Name</label><Input {...register('name')} /><p className="text-xs text-red-600">{errors.name?.message}</p></div>
          <div><label className="text-sm font-medium">Email</label><Input {...register('email')} /><p className="text-xs text-red-600">{errors.email?.message}</p></div>
          <div><label className="text-sm font-medium">Password</label><Input type="password" {...register('password')} /><p className="text-xs text-red-600">{errors.password?.message}</p></div>
          <div><label className="text-sm font-medium">Role</label><Select {...register('role')}><option value="student">Student</option><option value="warden">Warden</option></Select></div>
          {role === 'student' && (
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm">Roll</label><Input {...register('rollNumber')} placeholder="CS2021" /></div>
              <div><label className="text-sm">Branch</label><Input {...register('branch')} placeholder="CSE" /></div>
              <div><label className="text-sm">Year</label><Input type="number" {...register('year')} placeholder="2" /></div>
            </div>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Creating...' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-center text-sm">Have account? <Link to="/login" className="text-indigo-600 underline">Login</Link></p>
      </Card>
    </div>
  )
}
