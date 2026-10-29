import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import { freshJobFilter } from "../utils/jobExpiry.js";

const MONTHS_BACK = 7;

// "Not specified" is the schema default for jobcategory, not a real industry
const NO_CATEGORY = [null, "", "Not specified"];

// Case/space-insensitive grouping key for a trimmed string field
const keyExpr = (field) => ({
  $toLower: { $replaceAll: { input: { $replaceAll: { input: field, find: "  ", replacement: " " } }, find: "  ", replacement: " " } },
});

// Group rows by a label case/space-insensitively ("Branch Manager" ==
// "branch manager"), summing `sums` and showing the most common spelling.
// Rows must already carry `label` (trimmed, non-empty).
const groupByLabelStages = (sums) => [
  {
    $group: {
      _id: { key: keyExpr("$label"), label: "$label" },
      ...Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, { $sum: v }])),
      n: { $sum: 1 },
    },
  },
  { $sort: { n: -1, "_id.label": 1 } },
  {
    $group: {
      _id: "$_id.key",
      label: { $first: "$_id.label" },
      ...Object.fromEntries(Object.keys(sums).map((k) => [k, { $sum: `$${k}` }])),
    },
  },
];

const pctChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  if (current === previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const monthLabel = (year, monthIndex) =>
  `${new Date(year, monthIndex, 1).toLocaleString("en-US", { month: "short" })} '${String(year).slice(2)}`;

// Mongo expression for a job's "role": the recruiter-entered `designation`
// (e.g. "Branch Manager"), falling back to the legacy `title` field for
// older postings created before `designation` existed. This is what "Top
// Roles in Demand" and "Fastest Growing Role" both count jobs by — the
// designation with the most postings is the top role.
const roleExpr = () => ({
  $let: {
    vars: { d: { $trim: { input: { $ifNull: ["$designation", ""] } } } },
    in: {
      $cond: [
        { $eq: ["$$d", ""] },
        { $trim: { input: { $ifNull: ["$title", ""] } } },
        "$$d",
      ],
    },
  },
});

// $sum expressions counting postings dated this month vs last month
const monthSplit = (startOfThisMonthMs, startOfLastMonthMs) => ({
  thisMonth: { $cond: [{ $gte: ["$date", startOfThisMonthMs] }, 1, 0] },
  lastMonth: { $cond: [{ $and: [{ $gte: ["$date", startOfLastMonthMs] }, { $lt: ["$date", startOfThisMonthMs] }] }, 1, 0] },
});

// Picks the item with the highest month-over-month growth from a { _id, thisMonth, lastMonth } aggregation,
// falling back to the item with the highest raw count this month when there isn't enough history to show growth.
const pickFastestGrowing = (rows) => {
  const named = rows.filter((r) => r.label);
  if (named.length === 0) return null;

  const withHistory = named.filter((r) => r.lastMonth > 0);
  if (withHistory.length > 0) {
    const best = withHistory
      .map((r) => ({ label: r.label, deltaPct: pctChange(r.thisMonth, r.lastMonth), thisMonth: r.thisMonth }))
      .sort((a, b) => b.deltaPct - a.deltaPct || b.thisMonth - a.thisMonth || a.label.localeCompare(b.label))[0];
    if (best.deltaPct > 0) return { label: best.label, deltaPct: best.deltaPct };
  }

  const byVolume = named
    .map((r) => ({ label: r.label, thisMonth: r.thisMonth }))
    .sort((a, b) => b.thisMonth - a.thisMonth || a.label.localeCompare(b.label))[0];
  return byVolume.thisMonth > 0 ? { label: byVolume.label, deltaPct: null } : null;
};

export const getHiringPulseStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfThisMonthMs = startOfThisMonth.getTime();
    const startOfLastMonthMs = startOfLastMonth.getTime();
    const trendStartMs = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1).getTime();
    // Same definition of "active" as the public job listing: visible and under 30 days old
    const activeJob = { visible: true, ...freshJobFilter() };

    const [
      activeJobs,
      hiringCompanyIds,
      newCandidatesThisMonth,
      newCandidatesLastMonth,
      newCompaniesThisMonth,
      newCompaniesLastMonth,
      applicationsThisMonth,
      applicationsLastMonth,
      totalCandidates,
      topRolesAgg,
      locationsAgg,
      topCompaniesAgg,
      applicationsByRoleAgg,
      industrySplitAgg,
      monthlyTrendAgg,
      noticePeriodDocs,
      experienceDocs,
      roleGrowthAgg,
      industryGrowthAgg,
      highestSalaryJob,
    ] = await Promise.all([
      Job.countDocuments(activeJob),
      Job.distinct("companyId", activeJob),
      User.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
      Company.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      Company.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
      JobApplication.countDocuments({ date: { $gte: startOfThisMonthMs } }),
      JobApplication.countDocuments({ date: { $gte: startOfLastMonthMs, $lt: startOfThisMonthMs } }),
      User.countDocuments({}),
      Job.aggregate([
        { $match: activeJob },
        { $project: { label: roleExpr() } },
        { $match: { label: { $nin: [null, ""] } } },
        // Count postings per designation — the designation with the most
        // active postings (e.g. 10 "Branch Manager" jobs) ranks #1.
        ...groupByLabelStages({ jobs: 1 }),
        { $sort: { jobs: -1, label: 1 } },
        { $limit: 8 },
      ]),
      Job.aggregate([
        { $match: activeJob },
        // A posting's `location` can be a comma-separated list of cities
        // ("Mumbai, Pune, Remote"), so split it and count each city on its own.
        {
          $project: {
            companyId: 1,
            cities: {
              $map: {
                input: { $split: [{ $ifNull: ["$location", ""] }, ","] },
                as: "c",
                in: { $trim: { input: "$$c" } },
              },
            },
          },
        },
        { $unwind: "$cities" },
        { $match: { cities: { $nin: [null, ""] } } },
        // Group "Mumbai" / "mumbai" together; keep the most common spelling
        { $group: { _id: { key: keyExpr("$cities"), label: "$cities" }, n: { $sum: 1 }, companies: { $addToSet: "$companyId" } } },
        { $sort: { n: -1, "_id.label": 1 } },
        { $group: { _id: "$_id.key", label: { $first: "$_id.label" }, jobs: { $sum: "$n" }, companies: { $push: "$companies" } } },
        {
          $project: {
            label: 1,
            jobs: 1,
            companies: { $size: { $reduce: { input: "$companies", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } } },
          },
        },
        { $sort: { jobs: -1, label: 1 } },
        { $limit: 8 },
      ]),
      Job.aggregate([
        { $match: activeJob },
        { $group: { _id: "$companyId", jobs: { $sum: 1 } } },
        // Look up before limiting, so a deleted company never pushes the list below 6
        { $lookup: { from: "companies", localField: "_id", foreignField: "_id", as: "company" } },
        { $unwind: "$company" },
        { $project: { _id: 0, id: "$_id", name: "$company.name", jobs: 1 } },
        { $sort: { jobs: -1, name: 1 } },
        { $limit: 6 },
      ]),
      // Applications per role, using the applied job's designation/title.
      // Older applications have no stored jobTitle, so the job is the source of
      // truth; the stored jobTitle is only a fallback for deleted jobs.
      JobApplication.aggregate([
        { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "job" } },
        {
          $project: {
            jobRole: {
              $let: {
                vars: { j: { $arrayElemAt: ["$job", 0] } },
                in: {
                  $let: {
                    vars: { d: { $trim: { input: { $ifNull: ["$$j.designation", ""] } } } },
                    in: { $cond: [{ $eq: ["$$d", ""] }, { $trim: { input: { $ifNull: ["$$j.title", ""] } } }, "$$d"] },
                  },
                },
              },
            },
            stored: { $trim: { input: { $ifNull: ["$jobTitle", ""] } } },
          },
        },
        { $project: { label: { $cond: [{ $eq: ["$jobRole", ""] }, "$stored", "$jobRole"] } } },
        { $match: { label: { $nin: [null, ""] } } },
        ...groupByLabelStages({ value: 1 }),
        { $sort: { value: -1, label: 1 } },
        { $limit: 6 },
      ]),
      Job.aggregate([
        { $match: { ...activeJob, jobcategory: { $nin: NO_CATEGORY } } },
        { $project: { label: { $trim: { input: "$jobcategory" } } } },
        ...groupByLabelStages({ count: 1 }),
        { $sort: { count: -1, label: 1 } },
      ]),
      Job.aggregate([
        { $match: { date: { $gte: trendStartMs } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: { $toDate: "$date" } } },
            jobs: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.find({ noticePeriod: { $ne: "" } }, { noticePeriod: 1 }).lean(),
      User.find({ totalExperience: { $ne: "" } }, { totalExperience: 1 }).lean(),
      Job.aggregate([
        { $match: { date: { $gte: startOfLastMonthMs } } },
        { $project: { label: roleExpr(), date: 1 } },
        { $match: { label: { $nin: [null, ""] } } },
        ...groupByLabelStages(monthSplit(startOfThisMonthMs, startOfLastMonthMs)),
      ]),
      Job.aggregate([
        { $match: { date: { $gte: startOfLastMonthMs }, jobcategory: { $nin: NO_CATEGORY } } },
        { $project: { label: { $trim: { input: "$jobcategory" } }, date: 1 } },
        ...groupByLabelStages(monthSplit(startOfThisMonthMs, startOfLastMonthMs)),
      ]),
      Job.findOne(activeJob).sort({ salary: -1 }).select("title salary"),
    ]);

    // ── Derived / parsed values ────────────────────────────────────────────

    const hiringCompanies = hiringCompanyIds.length;

    const mostCompetitiveCity = locationsAgg.length
      ? { city: locationsAgg[0].label, jobs: locationsAgg[0].jobs }
      : null;

    const fastestGrowingRole = pickFastestGrowing(roleGrowthAgg);
    const fastestGrowingIndustry = pickFastestGrowing(industryGrowthAgg);

    // Share of all categorised active jobs: top 5 industries, the rest as "Others"
    const totalIndustryJobs = industrySplitAgg.reduce((sum, r) => sum + r.count, 0);
    const industryRows = industrySplitAgg.slice(0, 5).map((r) => ({ name: r.label, count: r.count }));
    const otherIndustryJobs = totalIndustryJobs - industryRows.reduce((sum, r) => sum + r.count, 0);
    if (otherIndustryJobs > 0) industryRows.push({ name: "Others", count: otherIndustryJobs });
    const industrySplit = industryRows.map((r) => ({
      name: r.name,
      value: totalIndustryJobs ? Math.round((r.count / totalIndustryJobs) * 100) : 0,
    }));

    // Fill in any missing months in the trend window with 0 so the chart has a continuous axis.
    const trendMap = new Map(monthlyTrendAgg.map((r) => [r._id, r.jobs]));
    const monthlyTrend = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyTrend.push({ month: monthLabel(d.getFullYear(), d.getMonth()), jobs: trendMap.get(key) || 0 });
    }

    const immediateRegex = /immediate/i;
    const daysRegex = /(\d+)\s*day/i;
    const monthsRegex = /(\d+)\s*month/i;
    let immediateJoiners = 0;
    let noticePeriodUnder30 = 0;
    noticePeriodDocs.forEach((u) => {
      const np = u.noticePeriod || "";
      if (immediateRegex.test(np)) {
        immediateJoiners += 1;
        noticePeriodUnder30 += 1;
        return;
      }
      const daysMatch = np.match(daysRegex);
      if (daysMatch && Number(daysMatch[1]) <= 30) {
        noticePeriodUnder30 += 1;
        return;
      }
      const monthsMatch = np.match(monthsRegex);
      if (monthsMatch && Number(monthsMatch[1]) === 0) {
        noticePeriodUnder30 += 1;
      }
    });

    const expValues = experienceDocs
      .map((u) => parseFloat(String(u.totalExperience).match(/[\d.]+/)?.[0]))
      .filter((v) => Number.isFinite(v));
    const avgExperienceYears = expValues.length
      ? Math.round((expValues.reduce((a, b) => a + b, 0) / expValues.length) * 10) / 10
      : null;

    res.json({
      success: true,
      data: {
        kpis: {
          activeJobs: { value: activeJobs },
          hiringCompanies: { value: hiringCompanies },
          newCandidates: { value: newCandidatesThisMonth, deltaPct: pctChange(newCandidatesThisMonth, newCandidatesLastMonth) },
          newCompanies: { value: newCompaniesThisMonth, deltaPct: pctChange(newCompaniesThisMonth, newCompaniesLastMonth) },
          applicationsReceived: { value: applicationsThisMonth, deltaPct: pctChange(applicationsThisMonth, applicationsLastMonth) },
        },
        fastestGrowingRole,
        fastestGrowingIndustry,
        highestSalary: highestSalaryJob ? { title: highestSalaryJob.title, salary: highestSalaryJob.salary } : null,
        mostCompetitiveCity,
        topRoles: topRolesAgg.map((r) => ({ role: r.label, jobs: r.jobs })),
        locations: locationsAgg.map((r) => ({ city: r.label, jobs: r.jobs, companies: r.companies })),
        topCompanies: topCompaniesAgg,
        applicationsByRole: applicationsByRoleAgg.map((r) => ({ name: r.label, value: r.value })),
        industrySplit,
        monthlyTrend,
        candidateIntel: {
          newRegistrations: { value: newCandidatesThisMonth, deltaPct: pctChange(newCandidatesThisMonth, newCandidatesLastMonth) },
          totalCandidates: { value: totalCandidates },
          immediateJoiners: { value: immediateJoiners },
          noticePeriodUnder30: { value: noticePeriodUnder30 },
          avgExperienceYears: { value: avgExperienceYears },
        },
      },
    });
  } catch (error) {
    console.error("Hiring pulse stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
