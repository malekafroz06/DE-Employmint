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

// Several people from one company (hr@x.com, ceo@x.com) each sign up as their
// own Company account, so companies are counted by name, not by account.
// "DE Employmint Pvt. Ltd.", "de-employmint" and "DEEmploymint" share one key.
const LEGAL_SUFFIX = /^(private|pvt|limited|ltd|llp|inc|incorporated|corp|corporation|opc)$/;
const companyKey = (name) => {
  let key = String(name || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
  // Drop trailing legal suffixes ("pvt ltd", "private limited", ...)
  let words = key.split(" ");
  while (words.length > 1 && LEGAL_SUFFIX.test(words[words.length - 1])) words.pop();
  return words.join("");
};

// $sum expressions counting postings dated this month vs last month
const monthSplit = (startOfThisMonthMs, startOfLastMonthMs) => ({
  thisMonth: { $cond: [{ $gte: ["$date", startOfThisMonthMs] }, 1, 0] },
  lastMonth: { $cond: [{ $and: [{ $gte: ["$date", startOfLastMonthMs] }, { $lt: ["$date", startOfThisMonthMs] }] }, 1, 0] },
});

// Picks the item that added the most postings this month compared with last
// month, from a { label, thisMonth, lastMonth } aggregation. Ranking by jobs
// added (not %) stops a tiny base winning (1 → 10 is "+900%") and still counts
// items that had no postings last month (0 → 31). % growth breaks ties.
// deltaPct is null when there were no postings last month (no % to show).
const pickFastestGrowing = (rows) => {
  const best = rows
    .filter((r) => r.label)
    .map((r) => ({
      label: r.label,
      added: r.thisMonth - r.lastMonth,
      thisMonth: r.thisMonth,
      deltaPct: r.lastMonth > 0 ? pctChange(r.thisMonth, r.lastMonth) : null,
    }))
    .sort((a, b) =>
      b.added - a.added ||
      (b.deltaPct ?? Infinity) - (a.deltaPct ?? Infinity) ||
      b.thisMonth - a.thisMonth ||
      a.label.localeCompare(b.label)
    )[0];
  if (!best || best.added <= 0) return null;
  return { label: best.label, deltaPct: best.deltaPct, added: best.added, thisMonth: best.thisMonth };
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
      companyDocs,
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
      Company.find({}, { name: 1, createdAt: 1 }).lean(),
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
            // Account ids — turned into a by-name company count below
            companyIds: { $reduce: { input: "$companies", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } },
          },
        },
        { $sort: { jobs: -1, label: 1 } },
        { $limit: 8 },
      ]),
      // Active jobs per account — merged per company name (and limited) below
      Job.aggregate([
        { $match: activeJob },
        { $group: { _id: "$companyId", jobs: { $sum: 1 } } },
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

    // Account id → company-name key, so every company count below is by name:
    // jobs posted from hr@x.com and ceo@x.com add up under one company
    const accountKey = new Map(companyDocs.map((c) => [String(c._id), companyKey(c.name)]));
    const accountName = new Map(companyDocs.map((c) => [String(c._id), String(c.name || "").trim()]));
    const countCompanies = (ids) => new Set(ids.map((id) => accountKey.get(String(id))).filter(Boolean)).size;

    const hiringCompanies = countCompanies(hiringCompanyIds);

    const companyJobs = new Map();
    topCompaniesAgg.forEach((row) => {
      const key = accountKey.get(String(row._id));
      if (!key) return; // account deleted
      const name = accountName.get(String(row._id));
      const entry = companyJobs.get(key) || { id: String(row._id), name, jobs: 0, nameJobs: 0 };
      entry.jobs += row.jobs;
      // Show the spelling used by the account with the most jobs
      if (row.jobs > entry.nameJobs) Object.assign(entry, { id: String(row._id), name, nameJobs: row.jobs });
      companyJobs.set(key, entry);
    });
    const topCompanies = [...companyJobs.values()]
      .sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name))
      .slice(0, 6)
      .map(({ id, name, jobs }) => ({ id, name, jobs }));

    // Unique companies by name; a company is "new" in the month its first account signed up
    const firstSignup = new Map();
    companyDocs.forEach((c) => {
      const key = companyKey(c.name);
      if (!key) return;
      const at = c.createdAt ? new Date(c.createdAt).getTime() : 0;
      if (!firstSignup.has(key) || at < firstSignup.get(key)) firstSignup.set(key, at);
    });
    const totalCompanies = firstSignup.size;
    const firstSignups = [...firstSignup.values()];
    const newCompaniesThisMonth = firstSignups.filter((t) => t >= startOfThisMonthMs).length;
    const newCompaniesLastMonth = firstSignups.filter((t) => t >= startOfLastMonthMs && t < startOfThisMonthMs).length;

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
          totalCompanies: { value: totalCompanies },
          newCandidates: { value: newCandidatesThisMonth, deltaPct: pctChange(newCandidatesThisMonth, newCandidatesLastMonth) },
          newCompanies: { value: newCompaniesThisMonth, deltaPct: pctChange(newCompaniesThisMonth, newCompaniesLastMonth) },
          applicationsReceived: { value: applicationsThisMonth, deltaPct: pctChange(applicationsThisMonth, applicationsLastMonth) },
        },
        fastestGrowingRole,
        fastestGrowingIndustry,
        highestSalary: highestSalaryJob ? { title: highestSalaryJob.title, salary: highestSalaryJob.salary } : null,
        mostCompetitiveCity,
        topRoles: topRolesAgg.map((r) => ({ role: r.label, jobs: r.jobs })),
        locations: locationsAgg.map((r) => ({ city: r.label, jobs: r.jobs, companies: countCompanies(r.companyIds) })),
        topCompanies,
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
