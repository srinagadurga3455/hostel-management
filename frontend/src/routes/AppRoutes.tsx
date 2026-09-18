import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '../pages/landing/LandingPage'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import StudentLayout from '../layouts/StudentLayout'
import WardenLayout from '../layouts/WardenLayout'
import StudentDashboard from '../pages/student/Dashboard'
import StudentFood from '../pages/student/Food'
import StudentComplaints from '../pages/student/Complaints'
import StudentOutings from '../pages/student/Outings'
import StudentLeaves from '../pages/student/Leaves'
import StudentAttendance from '../pages/student/Attendance'
import StudentAgent from '../pages/student/Agent'
import StudentProfile from '../pages/student/Profile'
import StudentRoom from '../pages/student/Room'
import WardenDashboard from '../pages/warden/Dashboard'
import WardenRooms from '../pages/warden/Rooms'
import WardenStudents from '../pages/warden/Students'
import WardenAttendance from '../pages/warden/Attendance'
import WardenFood from '../pages/warden/Food'
import WardenComplaints from '../pages/warden/Complaints'
import WardenOutings from '../pages/warden/Outings'
import WardenLeaves from '../pages/warden/Leaves'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student" element={<ProtectedRoute><RoleRoute allow={['student']}><StudentLayout /></RoleRoute></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="food" element={<StudentFood />} />
        <Route path="complaints" element={<StudentComplaints />} />
        <Route path="outings" element={<StudentOutings />} />
        <Route path="leaves" element={<StudentLeaves />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="agent" element={<StudentAgent />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="room" element={<StudentRoom />} />
      </Route>
      <Route path="/warden" element={<ProtectedRoute><RoleRoute allow={['warden']}><WardenLayout /></RoleRoute></ProtectedRoute>}>
        <Route index element={<WardenDashboard />} />
        <Route path="rooms" element={<WardenRooms />} />
        <Route path="students" element={<WardenStudents />} />
        <Route path="attendance" element={<WardenAttendance />} />
        <Route path="food" element={<WardenFood />} />
        <Route path="complaints" element={<WardenComplaints />} />
        <Route path="outings" element={<WardenOutings />} />
        <Route path="leaves" element={<WardenLeaves />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
