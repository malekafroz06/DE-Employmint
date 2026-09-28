import User from "../models/User.js";

// Escape any user-supplied text before using it inside a RegExp
const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Parse a free-text notice-period string → approximate days (null when unknown)
const noticePeriodToDays = (raw = "") => {
  const s = String(raw).toLowerCase().trim();
  if (!s) return null;
  if (/immediate|any\s*time|anytime|serving|already|no\s*notice|none|^0\b/.test(s)) return 0;
  const dayMatch = s.match(/(\d+)\s*day/);
  if (dayMatch) return Number(dayMatch[1]);
  const weekMatch = s.match(/(\d+)\s*week/);
  if (weekMatch) return Number(weekMatch[1]) * 7;
  const monthMatch = s.match(/(\d+(?:\.\d+)?)\s*month/);
  if (monthMatch) return Number(monthMatch[1]) * 30;
  const bare = Number(s.replace(/[^\d.]/g, ""));
  if (Number.isFinite(bare) && bare > 0) return bare; // treat a bare number as days
  return null;
};

// Parse a free-text CTC string → absolute annual rupees (null when unknown)
const ctcToRupees = (raw = "") => {
  const s = String(raw).toLowerCase().replace(/,/g, "").trim();
  if (!s) return null;
  const num = parseFloat(s.match(/[\d.]+/)?.[0]);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (/cr|crore/.test(s)) return num * 1e7;
  if (/lac|lakh|lpa|\bl\b/.test(s)) return num * 1e5;
  if (/\bk\b/.test(s)) return num * 1e3;
  // bare number: a small value is almost certainly "lakhs per annum"
  return num < 100 ? num * 1e5 : num;
};

const activelyLookingRegex = /activ|looking|immediate|open\s*to|casual|serious/i;

// GET /api/company/candidate-insights?designation=&category=&product=&salary=
// Live counts for the candidate pool, narrowed by whatever the recruiter has
// typed so far on the "Post a New Position" form.
export const getCandidateInsights = async (req, res) => {
  try {
    const designation = String(req.query.designation || "").trim();
    const category = String(req.query.category || "").trim();
    const product = String(req.query.product || "").trim();
    const budget = Number(req.query.salary);

    const conds = [];
    if (designation) {
      conds.push({ currentDesignation: { $regex: escapeRegex(designation), $options: "i" } });
    }
    if (category) {
      const rx = { $regex: escapeRegex(category), $options: "i" };
      conds.push({ $or: [{ category: rx }, { jobCategory: rx }, { sector: rx }] });
    }
    if (product) {
      conds.push({ selectedProducts: { $regex: escapeRegex(product), $options: "i" } });
    }
    const poolFilter = conds.length ? { $and: conds } : {};

    // "Available Candidates" is the pool that currently fits the position
    // (Designation / Category / Product typed so far) — with nothing typed
    // yet, that pool is the whole database, and it narrows the moment the
    // recruiter starts typing a Designation.
    const matched = await User.find(poolFilter, {
      currentDesignation: 1,
      jobChangeStatus: 1,
      noticePeriod: 1,
      expectedCTC: 1,
      currentCTC: 1,
    }).lean();
    const availableCandidates = matched.length;

    let activelyLooking = 0;
    let noticePeriodUnder30 = 0;
    let expectedCtcWithinBudget = 0;
    const hasBudget = Number.isFinite(budget) && budget > 0;

    matched.forEach((c) => {
      if (activelyLookingRegex.test(c.jobChangeStatus || "")) activelyLooking += 1;

      const days = noticePeriodToDays(c.noticePeriod);
      if (days !== null && days <= 30) noticePeriodUnder30 += 1;

      if (hasBudget) {
        const exp = ctcToRupees(c.expectedCTC) ?? ctcToRupees(c.currentCTC);
        if (exp !== null && exp <= budget) expectedCtcWithinBudget += 1;
      }
    });

    // A candidate is a "strong match" once they fit the position (designation /
    // category / product typed so far) *and*, once the recruiter has entered a
    // salary, their expected CTC also fits that budget. Before a salary is
    // entered, Strong Matches is just the position-matched pool; the moment
    // Salary (Annual) is filled in, it narrows to those who also clear budget.
    const strongMatches = hasBudget ? expectedCtcWithinBudget : matched.length;

    res.json({
      success: true,
      data: {
        availableCandidates,
        strongMatches,
        activelyLooking,
        noticePeriodUnder30,
        expectedCtcWithinBudget,
      },
    });
  } catch (error) {
    console.error("Candidate insights error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
