import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useAdmin } from '../context/AdminContext'
import { Trash2, ChevronLeft, ChevronRight, Send, X } from 'lucide-react'

const STATUS_STYLES = {
  new: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
}

export default function Inquiries() {
  const { backendUrl } = useAdmin()
  const [inquiries, setInquiries] = useState([])
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  // Reply modal state
  const [replyModal, setReplyModal] = useState(null) // inquiry object
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/inquiries`, {
        params: { page, limit: 10, status },
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      })
      if (data.success) {
        setInquiries(data.inquiries)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to fetch inquiries')
    } finally {
      setLoading(false)
    }
  }, [backendUrl, page, status])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return
    setDeletingId(id)
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      })
      if (data.success) { toast.success('Inquiry deleted'); fetchInquiries() }
    } catch {
      toast.error('Failed to delete inquiry')
    } finally {
      setDeletingId(null)
    }
  }

  const handleReply = async () => {
    if (!replyMessage.trim()) return toast.error('Please enter a reply message')
    setReplying(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/inquiries/${replyModal._id}/reply`,
        { replyMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      )
      if (data.success) {
        toast.success('Reply sent successfully!')
        setReplyModal(null)
        setReplyMessage('')
        fetchInquiries()
      }
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">
          Inquiries <span className="text-slate-400 text-base font-normal">({pagination.total ?? 0})</span>
        </h2>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading…</div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No inquiries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <tr key={inq._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{inq.fullName}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{inq.workEmail}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{inq.phoneNumber}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{inq.company}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={inq.additionalInfo}>
                      {inq.additionalInfo || <span className="italic text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inq.status]}`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setReplyModal(inq); setReplyMessage('') }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                          <Send size={13} />
                          Reply
                        </button>
                        <button
                          onClick={() => handleDelete(inq._id)}
                          disabled={deletingId === inq._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Page {page} of {pagination.pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Reply to Inquiry</h3>
              <button onClick={() => setReplyModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              {/* Inquiry summary */}
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1.5">
                <p><span className="font-medium text-slate-600">From:</span> {replyModal.fullName} ({replyModal.workEmail})</p>
                <p><span className="font-medium text-slate-600">Company:</span> {replyModal.company}</p>
                {replyModal.additionalInfo && (
                  <p><span className="font-medium text-slate-600">Message:</span> {replyModal.additionalInfo}</p>
                )}
                {replyModal.reply && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="font-medium text-slate-600 mb-1">Previous Reply:</p>
                    <p className="text-slate-500 whitespace-pre-line">{replyModal.reply}</p>
                  </div>
                )}
              </div>

              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows={5}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setReplyModal(null)}
                className="px-5 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={replying || !replyMessage.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
                {replying ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
