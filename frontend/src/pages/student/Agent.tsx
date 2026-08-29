import { Navigate } from 'react-router-dom'
// Merged into Dashboard — keep route for backward compatibility
export default function StudentAgent() {
  return <Navigate to="/student" replace />
}
