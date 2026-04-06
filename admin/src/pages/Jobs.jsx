import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useAdmin } from '../context/AdminContext'
import { Search, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'

export default function Jobs() {
  const { backendUrl } = useAdmin()
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/jobs`, {
        params: { page, limit: 10, search },
      })
      if (data.success) {
        setJobs(data.jobs)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [backendUrl, page, search])

  useEffect(() => {
    const timeout = setTimeout(fetchJobs, 300)
    return () => clearTimeout(timeout)
  }, [fetchJobs])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job and all its applications?')) return
    setActionId(id)
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/jobs/${id}`)
      if (data.success) { toast.success('Job deleted'); fetchJobs() }
    } catch {
      toast.error('Failed to delete job')
    } finally {
      setActionId(null)
    }
  }

  const handleToggle = async (id) => {
    setActionId(id)
    try {
      const { data } = await axios.patch(`${backendUrl}/api/admin/jobs/${id}/visibility`)
      if (data.success) {
        toast.success(data.message)
        setJobs(prev => prev.map(j => j._id === id ? { ...j, visible: data.visible } : j))
      }
    } catch {
      toast.error('Failed to toggle visibility')
    } finally {
      setActionId(null)
    }
  }

  const levelColor = (level) => {
    const map = { 'Entry Level': 'bg-green-100 text-green-700', 'Mid Level': 'bg-blue-100 text-blue-700', 'Senior Level': 'bg-purple-100 text-purple-700' }
    return map[level] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Jobs <span className="text-slate-400 text-base font-normal">({pagination.total ?? 0})</span></h2>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search by title…"
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
                <th className="text-left px-5 py-3 font-medium text-slate-600">Job Title</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">Company</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">Level</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 hidden lg:table-cell">Location</th>
                <th className="text-center px-5 py-3 font-medium text-slate-600">Visible</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No jobs found</td></tr>
              ) : jobs.map((j) => (
                <tr key={j._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-700 max-w-[180px] truncate">{j.title}</td>
                  <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      {j.companyId?.image && <img src={j.companyId.image} className="w-6 h-6 rounded-full object-cover" alt="" />}
                      <span className="truncate max-w-[120px]">{j.companyId?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(j.level)}`}>{j.level || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell truncate max-w-[120px]">{j.location || '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggle(j._id)}
                      disabled={actionId === j._id}
                      title={j.visible ? 'Hide job' : 'Show job'}
                      className={`transition-colors disabled:opacity-40 ${j.visible ? 'text-emerald-500 hover:text-emerald-700' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      {j.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(j._id)}
                      disabled={actionId === j._id}
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
