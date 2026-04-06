import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useAdmin } from '../context/AdminContext'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function Applications() {
  const { backendUrl } = useAdmin()
  const [applications, setApplications] = useState([])
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/applications`, {
        params: { page, limit: 10, status },
      })
      if (data.success) {
        setApplications(data.applications)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }, [backendUrl, page, status])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return
    setDeletingId(id)
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/applications/${id}`)
      if (data.success) { toast.success('Application deleted'); fetchApplications() }
    } catch {
      toast.error('Failed to delete application')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Applications <span className="text-slate-400 text-base font-normal">({pagination.total ?? 0})</span></h2>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Candidate ID</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">Job</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">Company</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden lg:table-cell">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No applications found</td></tr>
              ) : applications.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-xs truncate max-w-[120px]">{a.userId}</td>
                  <td className="px-5 py-3.5 text-slate-700 hidden sm:table-cell truncate max-w-[150px]">{a.jobId?.title || '—'}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {a.companyId?.image && <img src={a.companyId.image} className="w-5 h-5 rounded-full object-cover" alt="" />}
                      <span className="text-slate-500 truncate max-w-[120px]">{a.companyId?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-600'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 hidden lg:table-cell">
                    {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(a._id)}
                      disabled={deletingId === a._id}
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

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages} className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
