import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import DEEmploymintIcon from "../assets/DELogoTransparent.png";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FiBriefcase,
  FiHome,
  FiUsers,
  FiTarget,
  FiTrendingUp,
  FiTrendingDown,
  FiMapPin,
  FiUserPlus,
  FiUserCheck,
  FiCalendar,
  FiBarChart2,
  FiArrowRight,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const RED = "#DC2626";
const RED_STRONG = "#FF0000";
const NAVY = "#022030";
const GREEN = "#16A34A";
const INDUSTRY_COLORS = [RED, NAVY, "#9CA3AF", "#D1D5DB", "#E5E7EB"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const fmtNum = (n) => (typeof n === "number" ? n.toLocaleString() : "—");
const fmtCurrency = (n) => (typeof n === "number" ? `₹${n.toLocaleString()}` : "—");

// Renders a growth delta as "+12% vs last month" (green) or "-4% vs last month" (red).
// Returns null when there's no meaningful delta to show, so callers can hide the row entirely.
const deltaLabel = (deltaPct) => {
  if (deltaPct === null || deltaPct === undefined || Number.isNaN(deltaPct)) return null;
  return { text: `${deltaPct >= 0 ? "+" : ""}${deltaPct}% vs last month`, up: deltaPct >= 0 };
};

const Card = ({ children, className = "", delay = 0 }) => (
  <motion.div
    {...fadeUp}
    transition={{ duration: 0.4, delay }}
    className={`group bg-white rounded-xl border border-gray-100 shadow-lg hover:bg-[#022030] hover:border-transparent hover:shadow-2xl transition-colors duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="w-4 h-[3px] rounded-full" style={{ backgroundColor: RED }} />
    <h2 className="text-xs font-extrabold uppercase tracking-wide text-gray-800 group-hover:text-white transition-colors duration-300">{children}</h2>
  </div>
);

const GroupHeading = ({ children }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="w-10 h-1 rounded-full flex-none" style={{ backgroundColor: RED }} />
    <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: NAVY }}>{children}</h2>
  </div>
);

const EmptyState = ({ children }) => (
  <p className="text-xs text-gray-400 group-hover:text-white/50 italic transition-colors duration-300">{children}</p>
);

const StatContent = ({ s }) => {
  const delta = deltaLabel(s.deltaPct);
  return (
    <>
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: "#FEE2E2", color: RED }}>
        {s.icon}
      </div>
      <div className="text-lg font-extrabold text-gray-900 group-hover:text-white leading-tight transition-colors duration-300">{s.value}</div>
      <div className="text-xs font-semibold text-gray-600 group-hover:text-white/70 transition-colors duration-300">{s.label}</div>
      {delta ? (
        <div className="text-[11px] font-bold flex items-center gap-1" style={{ color: delta.up ? GREEN : "#B91C1C" }}>
          {delta.up ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />} {delta.text}
        </div>
      ) : (
        s.sub && <div className="text-[11px] text-gray-400 group-hover:text-white/50 font-medium transition-colors duration-300">{s.sub}</div>
      )}
    </>
  );
};

// separate = each stat in its own square card instead of one shared card
const StatGrid = ({ stats, cols = "sm:grid-cols-4", separate = false }) => separate ? (
  <div className={`grid grid-cols-2 ${cols} gap-4`}>
    {stats.map((s, i) => (
      <Card key={s.label} delay={i * 0.05} className="p-5 flex flex-col gap-2 aspect-square sm:aspect-auto sm:min-h-[11rem]">
        <StatContent s={s} />
      </Card>
    ))}
  </div>
) : (
  <Card className="p-6">
    <div className={`grid grid-cols-2 ${cols} gap-4`}>
      {stats.map((s) => {
        const delta = deltaLabel(s.deltaPct);
        return (
          <div key={s.label} className="flex flex-col gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: "#FEE2E2", color: RED }}>
              {s.icon}
            </div>
            <div className="text-lg font-extrabold text-gray-900 group-hover:text-white leading-tight transition-colors duration-300">{s.value}</div>
            <div className="text-xs font-semibold text-gray-600 group-hover:text-white/70 transition-colors duration-300">{s.label}</div>
            {delta ? (
              <div className="text-[11px] font-bold flex items-center gap-1" style={{ color: delta.up ? GREEN : "#B91C1C" }}>
                {delta.up ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />} {delta.text}
              </div>
            ) : (
              s.sub && <div className="text-[11px] text-gray-400 group-hover:text-white/50 font-medium transition-colors duration-300">{s.sub}</div>
            )}
          </div>
        );
      })}
    </div>
  </Card>
);

const HiringPulse = () => {
  const { backendUrl } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(`${backendUrl}/api/hiring-pulse`);
      if (data.success) {
        setStats(data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to load hiring pulse stats:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  const handleRequestReport = () => {
    toast.info("Full report export is coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: RED }} />
          <p className="text-sm text-gray-500">Loading hiring insights...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-sm text-gray-500">Couldn't load hiring insights right now.</p>
          <button
            onClick={fetchStats}
            className="text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: RED }}
          >
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    kpis,
    fastestGrowingRole,
    fastestGrowingIndustry,
    highestSalary,
    mostCompetitiveCity,
    topRoles,
    locations,
    topCompanies,
    applicationsByRole,
    industrySplit,
    monthlyTrend,
    candidateIntel,
  } = stats;

  const maxCompanyJobs = topCompanies.length ? Math.max(...topCompanies.map((c) => c.jobs)) : 0;

  const industrySplitColored = industrySplit.map((seg, i) => ({ ...seg, color: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }));

  const recruiterInsightStats = [
    { icon: <FiUserPlus />, value: fmtNum(kpis.newCandidates.value) + "+", label: "New Candidates", deltaPct: kpis.newCandidates.deltaPct },
    { icon: <FiHome />, value: fmtNum(kpis.newCompanies.value) + "+", label: "New Companies", deltaPct: kpis.newCompanies.deltaPct },
    { icon: <FiBarChart2 />, value: fmtNum(kpis.applicationsReceived.value) + "+", label: "Applications Received", deltaPct: kpis.applicationsReceived.deltaPct },
    {
      icon: <FiTrendingUp />,
      value: fastestGrowingIndustry?.label || "—",
      label: "Fastest Growing Industry",
      deltaPct: fastestGrowingIndustry?.deltaPct,
      sub: !fastestGrowingIndustry ? "Not enough data yet" : undefined,
    },
  ];

  const candidateInsightStats = [
    { icon: <FiBriefcase />, value: fmtNum(kpis.activeJobs.value) + "+", label: "Active Jobs", sub: "Currently open" },
    { icon: <FiHome />, value: fmtNum(kpis.hiringCompanies.value) + "+", label: "Hiring Companies", sub: "Currently hiring" },
    {
      icon: <FiTrendingUp />,
      value: fastestGrowingRole?.label || "—",
      label: "Fastest Growing Role",
      deltaPct: fastestGrowingRole?.deltaPct,
      sub: !fastestGrowingRole ? "Not enough data yet" : undefined,
    },
    {
      icon: <FiTarget />,
      value: highestSalary ? `${highestSalary.title} · ${fmtCurrency(highestSalary.salary)}` : "—",
      label: "Highest Salary",
      sub: "Top posted CTC",
    },
    {
      icon: <FiMapPin />,
      value: mostCompetitiveCity?.city || "—",
      label: "Most Competitive City",
      sub: mostCompetitiveCity ? `${mostCompetitiveCity.jobs}+ Active Jobs` : "Not enough data yet",
    },
  ];

  const candidateIntelTiles = [
    { icon: <FiUserPlus />, value: fmtNum(candidateIntel.newRegistrations.value), label: "New Registrations", deltaPct: candidateIntel.newRegistrations.deltaPct },
    { icon: <FiUsers />, value: fmtNum(candidateIntel.totalCandidates.value), label: "Total Candidates", sub: "All time" },
    { icon: <FiUserCheck />, value: fmtNum(candidateIntel.immediateJoiners.value), label: "Immediate Joiners", sub: "Current pool" },
    { icon: <FiCalendar />, value: fmtNum(candidateIntel.noticePeriodUnder30.value), label: "Notice Period <30 Days", sub: "Current pool" },
    {
      icon: <FiBarChart2 />,
      value: candidateIntel.avgExperienceYears.value !== null ? `${candidateIntel.avgExperienceYears.value} Yrs` : "—",
      label: "Average Experience",
      sub: "Current pool",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={DEEmploymintIcon} alt="DE employmint" className="h-8 w-auto object-contain" />
          <div>
            <p className="text-sm font-extrabold leading-tight transition-colors duration-300" style={{ color: NAVY }}>DE employmint</p>
            <p className="text-[9px] font-semibold text-gray-400 group-hover:text-white/50 tracking-wide transition-colors duration-300">Infinite Opportunity &bull; Infinite Talent</p>
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black leading-none tracking-tight">
          <span className="block text-gray-900 group-hover:text-white transition-colors duration-300">HIRING</span>
          <span className="block" style={{ color: RED }}>PULSE</span>
        </h1>
        <p className="mt-3 text-xs font-extrabold uppercase tracking-wide" style={{ color: RED }}>
          Daily Hiring Intelligence
        </p>
        <div className="w-12 h-[3px] rounded-full my-3" style={{ backgroundColor: RED }} />
        <p className="text-sm text-gray-600 group-hover:text-white/70 max-w-xs transition-colors duration-300">
          Stay ahead with real-time hiring insights and make smarter recruitment decisions.
        </p>
      </Card>

      {/* ================= RECRUITER'S INSIGHT ================= */}
      <GroupHeading>Recruiter's Insight</GroupHeading>
      <StatGrid stats={recruiterInsightStats} cols="sm:grid-cols-4" separate />

      {/* ================= CANDIDATE INSIGHT ================= */}
      <GroupHeading>Candidate Insight</GroupHeading>
      <StatGrid stats={candidateInsightStats} cols="sm:grid-cols-5" separate />

      {/* ================= ROLES / LOCATIONS / COMPANIES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr_1fr] gap-6">
        <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="rounded-xl p-6 text-white" style={{ backgroundColor: NAVY }}>
          <h2 className="text-xs font-extrabold uppercase tracking-wide mb-4">Top Roles in Demand</h2>
          {topRoles.length === 0 ? (
            <p className="text-xs text-white/50 italic">No roles posted yet.</p>
          ) : (
            <>
              <div className="space-y-3">
                {topRoles.map((r, i) => (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold flex-none" style={{ backgroundColor: RED }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm font-semibold">{r.role}</span>
                    <span className="text-sm font-extrabold" style={{ color: RED_STRONG }}>{r.jobs}</span>
                  </div>
                ))}
              </div>
              {topRoles.length >= 8 && <p className="mt-3 text-xs text-white/40 font-semibold">and more...</p>}
            </>
          )}
        </motion.div>

        <Card className="p-6">
          <SectionTitle>Jobs by Location</SectionTitle>
          {locations.length === 0 ? (
            <EmptyState>No locations to show yet.</EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-gray-400 group-hover:text-white/50 font-bold border-b border-gray-100 group-hover:border-white/10 transition-colors duration-300">
                      <th className="text-left pb-2">Location</th>
                      <th className="text-right pb-2">Active Jobs</th>
                      <th className="text-right pb-2">Companies Hiring</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((l) => (
                      <tr key={l.city} className="border-b border-gray-50 group-hover:border-white/10 transition-colors duration-300">
                        <td className="py-2 flex items-center gap-1.5 font-semibold text-gray-800 group-hover:text-white transition-colors duration-300">
                          <FiMapPin size={12} style={{ color: RED }} /> {l.city}
                        </td>
                        <td className="py-2 text-right text-gray-600 group-hover:text-white/70 font-medium tabular-nums transition-colors duration-300">{l.jobs}</td>
                        <td className="py-2 text-right text-gray-600 group-hover:text-white/70 font-medium tabular-nums transition-colors duration-300">{l.companies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {locations.length >= 8 && <p className="mt-2 text-xs text-gray-400 group-hover:text-white/50 font-semibold transition-colors duration-300">and more...</p>}
            </>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle>Top Hiring Companies</SectionTitle>
          {topCompanies.length === 0 ? (
            <EmptyState>No companies hiring yet.</EmptyState>
          ) : (
            <>
              <div className="space-y-4">
                {topCompanies.map((c) => (
                  <div key={c.name} className="grid grid-cols-[1fr_36px] items-center gap-3">
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-800 group-hover:text-white truncate transition-colors duration-300">{c.name}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 group-hover:bg-white/10 overflow-hidden transition-colors duration-300">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${maxCompanyJobs ? (c.jobs / maxCompanyJobs) * 100 : 0}%`, background: `linear-gradient(90deg, ${RED}, ${RED_STRONG})` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-right" style={{ color: RED }}>{c.jobs}+</span>
                  </div>
                ))}
              </div>
              {topCompanies.length >= 6 && <p className="mt-3 text-xs text-gray-400 group-hover:text-white/50 font-semibold transition-colors duration-300">and more...</p>}
            </>
          )}
        </Card>
      </div>

      {/* ================= APPLICATIONS / INDUSTRY SPLIT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <SectionTitle>Application Intelligence <span className="normal-case text-gray-400 group-hover:text-white/50 font-medium transition-colors duration-300">— by role</span></SectionTitle>
          {applicationsByRole.length === 0 ? (
            <EmptyState>No applications received yet.</EmptyState>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={applicationsByRole} margin={{ left: 0, right: 12, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  type="category"
                  dataKey="name"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#FEF2F2" }} formatter={(v) => v.toLocaleString()} />
                <Bar dataKey="value" fill={RED} radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle>Industry Hiring Split <span className="normal-case text-gray-400 group-hover:text-white/50 font-medium transition-colors duration-300">— share of active jobs</span></SectionTitle>
          {industrySplitColored.length === 0 ? (
            <EmptyState>No category data yet.</EmptyState>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-[140px] h-[140px] flex-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={industrySplitColored} dataKey="value" nameKey="name" innerRadius={44} outerRadius={64} paddingAngle={2}>
                      {industrySplitColored.map((seg) => (
                        <Cell key={seg.name} fill={seg.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {industrySplitColored.map((seg) => (
                  <div key={seg.name} className="flex items-center gap-2 text-xs font-semibold text-gray-600 group-hover:text-white/70 transition-colors duration-300">
                    <span className="w-2.5 h-2.5 rounded-sm flex-none" style={{ backgroundColor: seg.color }} />
                    <span className="flex-1">{seg.name}</span>
                    <span className="font-extrabold text-gray-900 group-hover:text-white transition-colors duration-300">{seg.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ================= MONTHLY TREND / CANDIDATE INTELLIGENCE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.45fr_0.55fr] gap-6">
        <Card className="p-6">
          <SectionTitle>Monthly Hiring Trend</SectionTitle>
          <p className="text-xs text-gray-500 group-hover:text-white/60 mb-2 transition-colors duration-300">Jobs posted over the last {monthlyTrend.length} months</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend} margin={{ left: -20, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={RED} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="jobs" stroke={RED} strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3.5, fill: RED }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <SectionTitle>Candidate Intelligence</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {candidateIntelTiles.map((c) => {
              const delta = deltaLabel(c.deltaPct);
              return (
                <div key={c.label} className="flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: "#FEE2E2", color: RED }}>
                    {c.icon}
                  </div>
                  <div className="text-lg font-extrabold text-gray-900 group-hover:text-white transition-colors duration-300">{c.value}</div>
                  <div className="text-[10.5px] font-semibold text-gray-600 group-hover:text-white/70 leading-tight transition-colors duration-300">{c.label}</div>
                  {delta ? (
                    <div className="text-[10px] font-bold flex items-center gap-1" style={{ color: delta.up ? GREEN : "#B91C1C" }}>
                      {delta.up ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />} {delta.text}
                    </div>
                  ) : (
                    c.sub && <div className="text-[10px] text-gray-400 group-hover:text-white/50 font-medium transition-colors duration-300">{c.sub}</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ================= CTA ================= */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4 }}
        className="rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ backgroundColor: NAVY }}
      >
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold leading-tight">
            Smarter Hiring. <span style={{ color: "#FF6B6B" }}>Better Results.</span>
          </h3>
          <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-lg leading-relaxed">
            Real-time data to help you hire faster and build high-performing teams.
          </p>
        </div>
        <button
          onClick={handleRequestReport}
          className="inline-flex items-center gap-2 self-start sm:self-auto flex-none text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: RED }}
        >
          Request Full Report <FiArrowRight size={13} />
        </button>
      </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default HiringPulse;
