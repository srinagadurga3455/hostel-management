import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../../api/users.api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { getErrorMessage } from '../../api/client'

export default function StudentProfile() {
  const { data, isLoading, error } = useQuery({ queryKey: ['me'], queryFn: usersApi.me })
  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>
  if (error) return <ErrorState message={getErrorMessage(error)} />
  return <div><PageHeader title="Profile" /><Card><p className="font-semibold">{data?.name}</p><p className="text-sm text-slate-600">{data?.email} — {data?.role}</p>{data?.student && <div className="mt-3 text-sm"><p>Roll: {data.student.rollNumber}</p><p>Branch: {data.student.branch}</p><p>Year: {data.student.year}</p></div>}</Card></div>
}
