import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAdmin } from '../context/AdminContext'
import { Users, Building2, Briefcase, FileText, UserCheck } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#10b981',
  rejected: '#ef4444',
}

const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6']

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        {sub != null && (
          <p className="text-xs text-slate-400 mt-0.5">+{sub} this month</p>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { backendUrl } = useAdmin()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${backendUrl}/api/admin/stats`)
      .then(({ data }) => { if (data.success) setStats(data.stats) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [backendUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const appStatusData = stats?.applicationsByStatus?.map((s) => ({
    name: s._id,
    value: s.count,
  })) || []

  const categoryData = stats?.jobsByCategory?.map((c) => ({
    name: c._id || 'Other',
    count: c.count,
  })) || []

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers} sub={stats?.recentUsers} icon={Users} color="bg-indigo-500" />
        <StatCard label="Companies" value={stats?.totalCompanies} sub={stats?.recentCompanies} icon={Building2} color="bg-purple-500" />
        <StatCard label="Jobs" value={stats?.totalJobs} sub={stats?.recentJobs} icon={Briefcase} color="bg-sky-500" />
        <StatCard label="Applications" value={stats?.totalApplications} icon={FileText} color="bg-amber-500" />
        <StatCard label="Sub-Users" value={stats?.totalSubUsers} icon={UserCheck} color="bg-emerald-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Category */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Jobs by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm">No data available</p>
          )}
        </div>

        {/* Applications by Status */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Applications by Status</h3>
          {appStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={appStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {appStatusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm">No data available</p>
          )}
        </div>
      </div>
    </div>
  )
}
