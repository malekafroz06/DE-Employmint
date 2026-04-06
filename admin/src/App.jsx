import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AdminProvider } from './context/AdminContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Companies from './pages/Companies'
import Jobs from './pages/Jobs'
import Applications from './pages/Applications'

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="companies" element={<Companies />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="applications" element={<Applications />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </AdminProvider>
  )
}
