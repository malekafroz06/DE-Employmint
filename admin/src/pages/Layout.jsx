import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/applications', label: 'Applications', icon: FileText },
]

export default function Layout() {
  const { admin, logout } = useAdmin()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-indigo-700 text-white w-64">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-indigo-600">
        <h1 className="text-xl font-bold tracking-tight">Job Portal</h1>
        <p className="text-indigo-300 text-xs mt-0.5">Super Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-indigo-700'
                  : 'text-indigo-100 hover:bg-indigo-600'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-indigo-600">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold uppercase">
            {admin?.name?.[0] || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{admin?.name}</p>
            <p className="text-indigo-300 text-xs truncate">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full text-indigo-200 hover:text-white text-sm px-2 py-1.5 rounded hover:bg-indigo-600 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex-shrink-0">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-800">Admin Panel</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
