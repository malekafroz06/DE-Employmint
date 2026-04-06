import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AdminContext = createContext(null)

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
  const [loading, setLoading] = useState(true)

  // Axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['admin-token'] = token
    } else {
      delete axios.defaults.headers.common['admin-token']
    }
  }, [token])

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return }
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/profile`)
        if (data.success) setAdmin(data.admin)
        else logout()
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  const login = (adminData, adminToken) => {
    setAdmin(adminData)
    setToken(adminToken)
    localStorage.setItem('adminToken', adminToken)
    axios.defaults.headers.common['admin-token'] = adminToken
  }

  const logout = () => {
    setAdmin(null)
    setToken('')
    localStorage.removeItem('adminToken')
    delete axios.defaults.headers.common['admin-token']
  }

  return (
    <AdminContext.Provider value={{ admin, token, loading, login, logout, backendUrl }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
