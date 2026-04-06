import { Navigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAdmin()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return admin ? children : <Navigate to="/login" replace />
}
