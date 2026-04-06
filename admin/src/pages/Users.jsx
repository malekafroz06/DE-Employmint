import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useAdmin } from '../context/AdminContext'
import { Search, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react'

export default function Users() {
  const { backendUrl } = useAdmin()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/users`, {
        params: { page, limit: 10, search },
      })
      if (data.success) {
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [backendUrl, page, search])

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timeout)
  }, [fetchUsers])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and all their applications?')) return
    setDeletingId(id)
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/users/${id}`)
      if (data.success) {
        toast.success('User deleted')
        fetchUsers()
      }
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Users <span className="text-slate-400 text-base font-normal">({pagination.total ?? 0})</span></h2>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-400">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <User size={15} />
                      </div>
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">{u.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{u.email || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(u._id)}
                      disabled={deletingId === u._id}
                      className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.pages}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
