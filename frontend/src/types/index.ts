export type Role = 'student' | 'warden'
export type AttendanceStatus = 'PRESENT' | 'ABSENT'
export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
export type OutingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LoginDto { email: string; password: string }
export interface RegisterDto { name: string; email: string; password: string; role: Role; rollNumber?: string | null; branch?: string | null; year?: number | null }

export interface StudentOutShort { id: number; rollNumber: string; branch: string; year: number; userId: number }
export interface UserOut { id: number; name: string; email: string; role: string; student: StudentOutShort | null }
export interface TokenResponse { token: string; user: UserOut }

export interface UserSafeOut { id: number; name: string; email: string; role: string }
export interface RoomOut { id: number; roomNumber: string; block: string; floor: number; capacity: number; occupied: number }
export interface StudentOut { id: number; rollNumber: string; branch: string; year: number; userId: number; roomId: number | null; user: UserSafeOut; room: RoomOut | null }

export interface CreateRoomDto { roomNumber: string; block: string; floor: number; capacity: number }
export interface UpdateRoomDto { block?: string; floor?: number; capacity?: number; occupied?: number }
export interface UpdateStudentDto { branch?: string; year?: number; roomId?: number | null }
export interface AssignRoomDto { roomId: number }

export interface AttendanceOut { id: number; studentId: number; date: string; status: AttendanceStatus }
export interface CreateAttendanceDto { studentId: number; date: string; status: AttendanceStatus }
export interface UpdateAttendanceDto { status: AttendanceStatus }

export interface ComplaintOut { id: number; studentId: number; title: string; description: string; status: ComplaintStatus; createdAt?: string; updatedAt?: string }
export interface CreateComplaintDto { title: string; description: string }
export interface UpdateComplaintStatusDto { status: ComplaintStatus }

export interface FoodMenuOut { id: number; day: DayOfWeek; breakfast: string; lunch: string; snacks: string; dinner: string }
export interface CreateFoodMenuDto { day: DayOfWeek; breakfast: string; lunch: string; snacks: string; dinner: string }
export interface UpdateFoodMenuDto { breakfast?: string; lunch?: string; snacks?: string; dinner?: string }

export interface OutingOut { id: number; studentId: number; destination: string; reason: string; outingDate: string; outTime: string; inTime: string; status: OutingStatus; createdAt?: string }
export interface CreateOutingDto { destination: string; reason: string; outingDate: string; outTime: string; inTime: string }

export interface LeaveOut { id: number; studentId: number; startDate: string; endDate: string; reason: string; status: LeaveStatus; createdAt?: string }
export interface CreateLeaveDto { startDate: string; endDate: string; reason: string }

export interface AgentChatRequest { message: string; session_id?: string }
export interface AgentChatResponse { success: boolean; message: string; session_id: string; tool_used?: string | null; requires_confirmation?: boolean; data?: unknown }
export interface ChatDto { message: string; conversationId?: string; history?: { role: string; content: string }[] }
export interface ChatResponse { response: string }

export interface ApiError { detail: string | { msg: string }[] }
