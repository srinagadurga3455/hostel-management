import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { studentsApi } from '../../api/students.api'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { getErrorMessage } from '../../api/client'

export default function StudentRoom() {
  const { user } = useAuth()
  const sid = user?.student?.id
  const { data, isLoading, error } = useQuery({ queryKey: ['student', sid], queryFn: () => studentsApi.get(sid!), enabled: !!sid })

  if (!sid) return <ErrorState message="No student profile found" />
  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>
  if (error) return <ErrorState message={getErrorMessage(error)} />

  const room: any = (data as any)?.room
  const roomNumber = room?.roomNumber ?? room?.room_number

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Room</h1>
        <p className="text-sm text-gray-500 mt-1">Your hostel room allocation</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {room ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{roomNumber}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Allocated</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Block</p>
                <p className="font-semibold text-gray-900 mt-1">{room.block}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Floor</p>
                <p className="font-semibold text-gray-900 mt-1">{room.floor}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Capacity</p>
                <p className="font-semibold text-gray-900 mt-1">{room.capacity}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Occupied</p>
                <p className="font-semibold text-gray-900 mt-1">{room.occupied} / {room.capacity}</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${room.capacity ? Math.round((room.occupied / room.capacity) * 100) : 0}%` }} />
            </div>
            <p className="text-xs text-gray-500">{room.capacity - room.occupied} beds available in this room</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-900 font-medium">No room allocated yet</p>
            <p className="text-sm text-gray-500 mt-1">Please contact your warden for room assignment.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Student Info</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{(data as any)?.user?.name ?? user?.name}</span></div>
          <div><span className="text-gray-500">Roll:</span> <span className="font-medium">{(data as any)?.rollNumber ?? (data as any)?.roll_number ?? user?.student?.rollNumber}</span></div>
          <div><span className="text-gray-500">Branch:</span> <span className="font-medium">{(data as any)?.branch}</span></div>
          <div><span className="text-gray-500">Year:</span> <span className="font-medium">{(data as any)?.year}</span></div>
        </div>
      </div>
    </div>
  )
}
