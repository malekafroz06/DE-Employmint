// Rule-based resume parser — turns the raw text of a resume into the
// candidateProfile shape used by the Search Resume "Edit Candidate" screen.
// Everything here is best-effort: a field is left blank ('') when the resume
// doesn't state it clearly, so the recruiter can fill it in by hand.

// ── Reference data ───────────────────────────────────────────────────────────

const SectorCategories = {
  "Capital Market": [
    "Stock Market", "Asset Management", "Portfolio Management",
    "Wealth Management", "Alternative Investment Fund", "Investment Banking",
  ],
  "NBFC Sector": [
    "Asset Finance Company (AFC)", "Loan Company (LC)", "Microfinance Institution (MFI)",
    "Housing Finance Company (HFC)", "Gold Loan NBFC", "Retail NBFC (Consumer Finance)",
  ],
  "Insurance Sector": ["Life Insurance", "General Insurance"],
  "Prop Trading": ["Fundamental Analysis", "Technical Analysis", "Quant Analysis", "Algo Trading"],
};

// Keywords that point to a category, and the product each keyword implies (if any)
const CategoryKeywords = {
  "Stock Market": [
    ["equity", "Equity"], ["equities", "Equity"], ["stock broking", "Equity"], ["share broking", "Equity"],
    ["broking", null], ["demat", "Equity"], ["trading account", "Equity"], ["sub broker", null],
    ["sub-broker", null], ["stock market", "Equity"], ["commodity", "Commodity"], ["commodities", "Commodity"],
    ["currency derivatives", "Currency"], ["forex", "Currency"], ["securities", null], ["dealer", null],
  ],
  "Asset Management": [
    ["mutual fund", "Mutual Fund"], ["mutual funds", "Mutual Fund"], ["amc", "Mutual Fund"],
    ["sip", "SIP"], ["etf", "ETF"], ["asset management", null],
  ],
  "Portfolio Management": [
    ["pms", null], ["portfolio management", null], ["discretionary", "Discretionary Portfolio Management"],
  ],
  "Wealth Management": [
    ["wealth management", "Wealth Planning"], ["wealth manager", "Wealth Planning"],
    ["wealth planning", "Wealth Planning"], ["investment advisory", "Investment Advisory"],
    ["financial planning", "Wealth Planning"], ["private banking", "Wealth Planning"], ["hni", null],
  ],
  "Alternative Investment Fund": [
    ["alternative investment", null], ["aif", null], ["private equity", "Private Equity"],
    ["venture capital", "Venture Capital"], ["hedge fund", "Hedge Funds"],
  ],
  "Investment Banking": [
    ["investment banking", null], ["ipo", "IPO Advisory"], ["mergers", "M&A"], ["m&a", "M&A"],
    ["capital raising", "Capital Raising"], ["debt syndication", "Debt Syndication"],
  ],
  "Asset Finance Company (AFC)": [
    ["commercial vehicle", "Commercial Vehicle Loans"], ["construction equipment", "Construction Equipment Loans"],
    ["tractor loan", "Tractor Loan"], ["car loan", "Car Finance"], ["car finance", "Car Finance"],
    ["auto loan", "Car Finance"], ["vehicle loan", "Passenger Vehicle Finance"], ["vehicle finance", "Passenger Vehicle Finance"],
    ["two wheeler", "Passenger Vehicle Finance"], ["machinery finance", "Machinery Finance"],
    ["equipment finance", "Equipment Finance"],
  ],
  "Loan Company (LC)": [
    ["personal loan", "Personal Loans"], ["business loan", "Business Loans"], ["msme", "MSME Loans"],
    ["sme loan", "MSME Loans"], ["unsecured loan", "Personal Loans"],
  ],
  "Microfinance Institution (MFI)": [
    ["microfinance", "Micro Loans"], ["micro finance", "Micro Loans"], ["group loan", "Group Loans"],
    ["jlg", "Group Loans"], ["rural credit", "Rural Credit"], ["women group", "Women Group Lending"],
  ],
  "Housing Finance Company (HFC)": [
    ["home loan", "Home Loans"], ["housing finance", "Home Loans"], ["housing loan", "Home Loans"],
    ["loan against property", "Loan Against Property (LAP)"], ["lap", "Loan Against Property (LAP)"],
    ["mortgage", "Loan Against Property (LAP)"], ["affordable housing", "Affordable Housing Loans"],
  ],
  "Gold Loan NBFC": [["gold loan", "Gold Loans (Secured Loans)"]],
  "Retail NBFC (Consumer Finance)": [
    ["consumer durable", "Consumer Durable Loans"], ["consumer finance", "Consumer Durable Loans"],
  ],
  "Life Insurance": [
    ["life insurance", null], ["term plan", "Term Plans"], ["term insurance", "Term Plans"],
    ["ulip", "ULIPs"], ["endowment", "Endowment Plan"], ["life advisor", null], ["lic", null],
  ],
  "General Insurance": [
    ["general insurance", null], ["health insurance", "Health Insurance"], ["motor insurance", "Motor Insurance"],
    ["travel insurance", "Travel Insurance"], ["fire insurance", "Fire Insurance"],
    ["marine insurance", "Marine Insurance"], ["property insurance", "Property Insurance"], ["non-life", null],
  ],
  "Fundamental Analysis": [["fundamental analysis", null], ["equity research", "Buy Side"], ["buy side", "Buy Side"], ["sell side", "Sell Side"]],
  "Technical Analysis": [["technical analysis", null], ["derivative", "Derivative"], ["f&o", "Derivative"]],
  "Quant Analysis": [["quant", "Quant Modeling"], ["quantitative", "Quant Modeling"]],
  "Algo Trading": [["algo trading", "Algorithmic Trading Strategies"], ["algorithmic trading", "Algorithmic Trading Strategies"]],
};

const ChannelKeywords = [
  ["Bancassurance", ["bancassurance", "banca"]],
  ["Agency Channel", ["agency channel", "agency", "life advisor", "advisors", "agents"]],
  ["Sub Broker", ["sub broker", "sub-broker", "authorised person", "authorized person"]],
  ["Broker Channel", ["broker channel"]],
  ["POSP (Point of Sales Person)", ["posp"]],
  ["DSA", ["dsa", "direct selling agent"]],
  ["Direct Sales", ["direct sales", "direct channel", "dst"]],
  ["Digital/Online Sales", ["digital sales", "online sales", "tele sales", "telesales"]],
  ["Corporate / Group Channel", ["corporate channel", "group insurance", "corporate sales"]],
  ["Worksite Marketing", ["worksite"]],
  ["IAF", ["iaf"]],
];

const IndianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Chandigarh", "Puducherry",
];

const CityState = {
  Mumbai: "Maharashtra", "Navi Mumbai": "Maharashtra", Thane: "Maharashtra", Pune: "Maharashtra", Nagpur: "Maharashtra",
  Nashik: "Maharashtra", Aurangabad: "Maharashtra", Kolhapur: "Maharashtra",
  Ahmedabad: "Gujarat", Surat: "Gujarat", Vadodara: "Gujarat", Baroda: "Gujarat", Rajkot: "Gujarat", Gandhinagar: "Gujarat",
  Anand: "Gujarat", Nadiad: "Gujarat", Bhavnagar: "Gujarat", Jamnagar: "Gujarat", Vapi: "Gujarat", Valsad: "Gujarat",
  Navsari: "Gujarat", Bharuch: "Gujarat", Mehsana: "Gujarat", Junagadh: "Gujarat",
  Delhi: "Delhi", "New Delhi": "Delhi", Noida: "Uttar Pradesh", Gurgaon: "Haryana", Gurugram: "Haryana", Faridabad: "Haryana",
  Ghaziabad: "Uttar Pradesh", Lucknow: "Uttar Pradesh", Kanpur: "Uttar Pradesh", Varanasi: "Uttar Pradesh", Agra: "Uttar Pradesh",
  Bangalore: "Karnataka", Bengaluru: "Karnataka", Mysore: "Karnataka", Mangalore: "Karnataka",
  Chennai: "Tamil Nadu", Coimbatore: "Tamil Nadu", Madurai: "Tamil Nadu",
  Hyderabad: "Telangana", Secunderabad: "Telangana", Vijayawada: "Andhra Pradesh", Visakhapatnam: "Andhra Pradesh",
  Kolkata: "West Bengal", Jaipur: "Rajasthan", Udaipur: "Rajasthan", Jodhpur: "Rajasthan", Kota: "Rajasthan",
  Indore: "Madhya Pradesh", Bhopal: "Madhya Pradesh", Gwalior: "Madhya Pradesh",
  Patna: "Bihar", Ranchi: "Jharkhand", Bhubaneswar: "Odisha", Raipur: "Chhattisgarh",
  Chandigarh: "Chandigarh", Ludhiana: "Punjab", Amritsar: "Punjab", Kochi: "Kerala", Thiruvananthapuram: "Kerala",
  Guwahati: "Assam", Dehradun: "Uttarakhand", Panaji: "Goa",
};

const Languages = [
  "English", "Hindi", "Gujarati", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Punjabi",
  "Urdu", "Odia", "Assamese", "Konkani", "Sindhi", "Marwari", "Arabic", "French", "German",
];

const DesignationWords = /\b(manager|executive|officer|advisor|adviser|associate|analyst|head|lead|consultant|dealer|relationship|agent|engineer|developer|director|supervisor|assistant|trainee|intern|specialist|coordinator|president|vp|avp|partner|banker|underwriter|trader|planner|representative|clerk|accountant|cashier|administrator|leader|chief|ceo|cfo|coo|founder|teller|recruiter)\b/i;
const CompanyWords = /\b(pvt\.?|private|ltd\.?|limited|llp|inc\.?|corp\.?|corporation|bank|securities|broking|insurance|finance|financial|capital|industries|enterprises|solutions|services|technologies|group|hotels?|resorts?|company)\b/i;

const Months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const MonthRx = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

// ── Small helpers ────────────────────────────────────────────────────────────

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text, word) => new RegExp(`(^|[^a-z0-9])${escapeRx(word)}([^a-z0-9]|$)`, "i").test(text);
const countWord = (text, word) => (text.match(new RegExp(`(^|[^a-z0-9])${escapeRx(word)}(?=[^a-z0-9]|$)`, "gi")) || []).length;
const titleCase = (s) => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
const Bullets = "•●▪◦·➢►▶✓✔❖■□○◆◇★➤→*";
const BulletStart = new RegExp(`^[${Bullets}]`);
const clean = (s) => String(s || "")
  .replace(/\s+/g, " ")
  .replace(new RegExp(`^[\\s:–—\\-|,.${Bullets}]+|[\\s:–—\\-|,${Bullets}]+$`, "g"), "")
  .trim();

// Split on commas / semicolons / pipes / bullets, but not inside parentheses
const splitList = (s) => {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && (",;|".includes(ch) || Bullets.includes(ch))) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
};

// Value written after a label, e.g. "Notice Period : 30 days" → "30 days"
const labelValue = (lines, labelRx) => {
  for (const line of lines) {
    const m = line.match(new RegExp(`(?:^|\\s|\\|)(?:${labelRx})\\s*(?:[:\\-–—=]|\\s{2,})\\s*(.+)`, "i"));
    if (m) {
      // Stop at the next "Label :" on the same line (two-column layouts)
      const v = clean(m[1].split(/\s{2,}|\s\|\s|\s[A-Z][A-Za-z .]{2,20}\s?:\s/)[0]);
      if (v) return v;
    }
  }
  return "";
};

// ── Sections ─────────────────────────────────────────────────────────────────

const SectionHeadings = {
  summary: /(summary|objective|profile|about me)/,
  experience: /(experience|employment|work history|career history|professional background)/,
  education: /(education|qualification|academic)/,
  skills: /(skills|competenc|expertise|strengths)/,
  personal: /(personal (details|information|profile|data)|personal|contact)/,
  languages: /^languages?( known)?$/,
  // Dates in these sections are project / course years, not employment
  projects: /(projects?|certificat\w*|courses?|achievements?|awards?|trainings?|workshops?|publications?)/,
  other: /(declaration|hobbies|interests|references?|internships?|responsibilities|tasks)/,
};

const headingOf = (line) => {
  if (BulletStart.test(line)) return null;
  const raw = line.replace(/[:\-–—•|]+\s*$/, "").trim();
  if (!raw || raw.length > 45 || raw.split(/\s+/).length > 6) return null;
  if (/[.,;]$/.test(line.trim()) || /\d{3,}/.test(raw)) return null;
  const isHeadingStyle = raw === raw.toUpperCase() || /:\s*$/.test(line) || raw.split(/\s+/).length <= 3;
  if (!isHeadingStyle) return null;
  const l = raw.toLowerCase();
  for (const key of ["languages", "projects", "personal", "experience", "education", "skills", "summary", "other"]) {
    if (SectionHeadings[key].test(l)) return key;
  }
  return null;
};

const splitSections = (lines) => {
  const sections = { header: [] };
  let current = "header";
  for (const line of lines) {
    const h = headingOf(line);
    if (h) {
      current = h;
      sections[current] = sections[current] || [];
      continue;
    }
    sections[current].push(line);
  }
  return sections;
};

// ── Field extractors ─────────────────────────────────────────────────────────

// Words that sit near the top of a resume but are never part of a person's name
const NotNameWords = new RegExp(
  "\\b(diploma|iti|ssc|hsc|sslc|degree|bachelors?|masters?|graduate|graduation|post|b\\.?\\s?com|m\\.?\\s?com|b\\.?\\s?sc|m\\.?\\s?sc|" +
  "bba|bca|mba|mca|b\\.?\\s?tech|m\\.?\\s?tech|b\\.?\\s?e|phd|engineering|electrical|mechanical|civil|commerce|science|arts|" +
  "university|college|school|institute|board|percentage|cgpa|fresher|objective|summary|profile|portfolio|" +
  "skills?|education|experience|languages?|contact|address|phone|mobile|email|hobbies|declaration|" +
  `${Languages.join("|")}|${Object.keys(CityState).join("|")}|${IndianStates.join("|")}|india)\\b`,
  "i"
);

const extractName = (lines, email = "") => {
  const labelled = labelValue(lines.slice(0, 15), "name|full name|candidate name");
  if (labelled && /^[A-Za-z .]{3,50}$/.test(labelled)) return titleCase(labelled);

  // Score every plausible line near the top instead of trusting the first one —
  // designed resumes often put a degree or logo text ("Diploma", "IC") above the name.
  const emailUser = email.split("@")[0].toLowerCase().replace(/[^a-z]/g, "");
  let best = null;
  lines.slice(0, 20).forEach((line, i) => {
    const l = clean(line);
    if (/^(resume|curriculum vitae|cv|bio[- ]?data)$/i.test(l) || /\b(resume|details|candidate)\b/i.test(l)) return;
    if (/[@\d]/.test(l) || headingOf(line) || DesignationWords.test(l) || NotNameWords.test(l)) return;
    if (!/^[A-Za-z .']+$/.test(l) || l.length > 45 || l.replace(/[^A-Za-z]/g, "").length < 4) return;
    const words = l.split(/\s+/).filter((w) => w.replace(/[^A-Za-z]/g, "").length > 0);
    if (words.length < 1 || words.length > 5) return;

    let score = (20 - i) / 20; // earlier is slightly better
    if (words.length >= 2 && words.length <= 4) score += 3;
    if (l === l.toUpperCase() || words.every((w) => /^[A-Z]/.test(w))) score += 1;
    if (emailUser) {
      score += 4 * words.filter((w) => w.length >= 3 && emailUser.includes(w.toLowerCase().replace(/[^a-z]/g, ""))).length;
    }
    if (!best || score > best.score) best = { name: l, score };
  });
  return best ? titleCase(best.name) : "";
};

const extractPhone = (text) => {
  const m = text.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/);
  if (m) return m[0].replace(/[^\d+]/g, "");
  const any = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return any ? any[0].trim() : "";
};

const parseDate = (s) => {
  if (!s) return "";
  let m = s.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?[\\s\\-/.,]+${MonthRx}[a-z]*[\\s\\-/.,]+(\\d{4})`, "i"));
  if (m) return toIso(+m[3], Months[m[2].slice(0, 3).toLowerCase()], +m[1]);
  m = s.match(new RegExp(`${MonthRx}[a-z]*[\\s\\-/.]+(\\d{1,2})(?:st|nd|rd|th)?[\\s,]+(\\d{4})`, "i"));
  if (m) return toIso(+m[3], Months[m[1].slice(0, 3).toLowerCase()], +m[2]);
  m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m) return toIso(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (m) return toIso(+m[1], +m[2] - 1, +m[3]);
  return "";
};
const toIso = (y, mo, d) => {
  if (!(y > 1940 && y < 2015) || !(mo >= 0 && mo <= 11) || !(d >= 1 && d <= 31)) return "";
  return `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

const extractDob = (lines) => {
  for (const line of lines) {
    const m = line.match(/(?:date\s*of\s*birth|d\.?\s*o\.?\s*b\.?|birth\s*date)\s*[:\-–—.]?\s*(.{6,30})/i);
    if (m) {
      const d = parseDate(m[1]);
      if (d) return d;
    }
  }
  return "";
};

const extractGender = (lines) => {
  const v = labelValue(lines, "gender|sex").toLowerCase();
  if (/^f|female/.test(v)) return "Female";
  if (/^m|male/.test(v)) return "Male";
  return "";
};

const extractMaritalStatus = (lines) => {
  const v = labelValue(lines, "marital\\s*status|married\\s*status").toLowerCase();
  if (/unmarried|single/.test(v)) return "Single";
  if (/married/.test(v)) return "Married";
  return "";
};

const extractLanguages = (lines, sections) => {
  // "Languages Known: English, Hindi," often wraps — read the next line too
  const labelIdx = lines.findIndex((l) => /languages?\s*known|linguistic\s*proficiency/i.test(l));
  const wrapped = labelIdx >= 0 ? lines.slice(labelIdx, labelIdx + 2).join(" ") : "";
  const source = [labelValue(lines, "languages?\\s*known|languages?|linguistic\\s*proficiency"), wrapped, ...(sections.languages || [])].join(" ");
  return Languages.filter((lang) => hasWord(source, lang)).join(", ");
};

const extractLocation = (lines, sections) => {
  // Prefer an explicit label, then the contact block at the top of the resume
  const labelled = labelValue(lines, "current\\s*location|location|address|city|residing\\s*at|place");
  const headerArea = [labelled, ...sections.header.slice(0, 12), ...(sections.personal || [])].filter(Boolean);

  // Address lines elsewhere in the resume (sidebars often put contact info last)
  const addressLike = lines.filter((l) => /\b(road|nagar|society|near|nr\.?|dist|pin|chowk|colony|sector|flat|apartment|soc\.?)\b|\b\d{6}\b/i.test(l));
  const cities = Object.keys(CityState).sort((a, b) => b.length - a.length);

  for (const area of [...headerArea, ...addressLike]) {
    const state = IndianStates.find((s) => hasWord(area, s));
    const city = cities.find((c) => hasWord(area, c));
    if (city) return { city, state: state || CityState[city] };
    if (state) {
      // "Nadiad, Gujarat, India" → the comma-part right before the state is the city
      const parts = area.split(/[,|]/).map(clean);
      const idx = parts.findIndex((p) => hasWord(p, state));
      const before = idx > 0 ? parts[idx - 1] : "";
      const cityGuess = /^[A-Za-z .]{3,25}$/.test(before) ? titleCase(before) : "";
      return { city: cityGuess, state };
    }
  }
  return { city: "", state: "" };
};

// "Jan 2020 - Present", "Sep 2020 to March 2022", "2018 - 2021", "Continue From May 2022"
const extractDateRanges = (text) => {
  const now = new Date();
  // "18sep 2023" / "Feb 2023" / "09/12/2010" / "12/2010" / "2019"
  const point = `(?:(?:\\d{1,2}\\s*)?${MonthRx}[a-z]*[\\s'’,.-]*(\\d{4}|\\d{2})|(?:\\d{1,2}[/.-])?(\\d{1,2})[/.-]\\s?(\\d{4})|(\\d{4}))`;
  const end = `(?:${point}|(present|current|till\\s*date|to\\s*date|now|ongoing|continu\\w*))`;
  // Ranges never span lines; the separator is required except between two
  // month-dates ("From 17 May2022 01 feb 2023").
  const rx = new RegExp(`${point}[ \\t]*(?:-|–|—|to|till|until)[ \\t]*${end}`, "gi");
  const monthPair = new RegExp(`(?:\\d{1,2}[ \\t]*)?${MonthRx}[a-z]*[ \\t'’,.-]*(\\d{4})[ \\t]+(?:\\d{1,2}[ \\t]*)?${MonthRx}[a-z]*[ \\t'’,.-]*(\\d{4})`, "gi");
  const ranges = [];
  const toMonths = (mon, yr, numMon, numYr, yOnly) => {
    if (mon) {
      let y = +yr; if (y < 100) y += 2000;
      return y * 12 + Months[mon.slice(0, 3).toLowerCase()];
    }
    if (numMon) return +numYr * 12 + (+numMon - 1);
    if (yOnly) return +yOnly * 12;
    return null;
  };
  let m;
  while ((m = rx.exec(text))) {
    const start = toMonths(m[1], m[2], m[3], m[4], m[5]);
    const finish = m[11] ? now.getFullYear() * 12 + now.getMonth() : toMonths(m[6], m[7], m[8], m[9], m[10]);
    if (start && finish && finish >= start && start / 12 > 1970 && finish - start < 600) ranges.push([start, finish]);
  }
  while ((m = monthPair.exec(text))) {
    const start = +m[2] * 12 + Months[m[1].slice(0, 3).toLowerCase()];
    const finish = +m[4] * 12 + Months[m[3].slice(0, 3).toLowerCase()];
    if (finish >= start && start / 12 > 1970 && finish - start < 600) ranges.push([start, finish]);
  }
  const fromRx = new RegExp(`(?:since|from|continu\\w*\\s+from)\\s+${MonthRx}[a-z]*[\\s,.-]*(\\d{4})(?!\\s*(?:-|–|to))`, "gi");
  while ((m = fromRx.exec(text))) {
    ranges.push([+m[2] * 12 + Months[m[1].slice(0, 3).toLowerCase()], now.getFullYear() * 12 + now.getMonth()]);
  }
  return ranges;
};

const formatMonths = (total) => {
  const y = Math.floor(total / 12);
  const mo = total % 12;
  if (y && mo) return `${y} year${y > 1 ? "s" : ""} ${mo} month${mo > 1 ? "s" : ""}`;
  if (y) return `${y} year${y > 1 ? "s" : ""}`;
  return `${mo} month${mo > 1 ? "s" : ""}`;
};

const extractTotalExperience = (text, lines, sections) => {
  const labelled = labelValue(lines, "total\\s*(?:work\\s*)?experience|overall\\s*experience|experience\\s*\\(?in\\s*years\\)?|total\\s*exp\\.?");
  if (labelled && /\d/.test(labelled) && labelled.length < 30) return labelled;

  const stated = text.match(/(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)\.?(?:\s*(?:and|&)?\s*(\d{1,2})\s*months?)?\s+(?:of\s+)?(?:[a-z&-]+\s+){0,4}?experience/i)
    || text.match(/experience\s+of\s+(?:over\s+|more than\s+)?(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)/i);
  if (stated) {
    const y = parseFloat(stated[1]);
    const mo = stated[2] ? +stated[2] : 0;
    return mo ? `${y} years ${mo} months` : `${y} year${y === 1 ? "" : "s"}`;
  }

  // Add up the employment date ranges (overlaps merged) — everywhere except the
  // education and project / certificate sections, whose "2017 - 2020" ranges
  // are study or project years.
  // Two-column PDFs scatter education dates outside the Education section, so
  // also drop any line that is, or sits right under, a degree / school line.
  const nonWorkLines = new Set([...(sections.education || []), ...(sections.projects || [])]);
  const isEduText = (l) => EducationLevels.some(([, rx]) => rx.test(l)) || InstituteWords.test(l);
  const workText = lines.filter((l, i) =>
    !nonWorkLines.has(l) &&
    !/birth|d\.?o\.?b/i.test(l) &&
    !lines.slice(Math.max(0, i - 3), i + 1).some(isEduText)
  ).join("\n");
  {
    const ranges = extractDateRanges(workText).sort((a, b) => a[0] - b[0]);
    const merged = [];
    ranges.forEach(([s, e]) => {
      const last = merged[merged.length - 1];
      if (last && s <= last[1]) last[1] = Math.max(last[1], e);
      else merged.push([s, e]);
    });
    const total = merged.reduce((sum, [s, e]) => sum + (e - s), 0);
    if (total > 0) return formatMonths(total);

    // "Experience : 6 month" written per job
    let months = 0;
    (sections.experience || []).forEach((l) => {
      const mm = l.match(/experience\s*[:\-]\s*(\d{1,2})\s*(year|yr|month)/i);
      if (mm) months += /month/i.test(mm[2]) ? +mm[1] : +mm[1] * 12;
    });
    if (months) return formatMonths(months);
  }

  if (/\bfresher\b|\bentry[- ]level\b/i.test(text) && !sections.experience?.length) return "Fresher";
  return "";
};

const stripDates = (s) => clean(
  s.replace(/\s+(till\s*date|till|from|since|duration|currently)\b.*$/i, "")
    .replace(new RegExp(`\\(?\\s*(?:\\d{1,2}\\s*)?${MonthRx}[a-z]*[\\s'’,.-]*\\d{2,4}.*$`, "i"), "")
    .replace(/\(?\s*\b\d{1,2}[/.-]\d{1,2}[/.-]\s?\d{4}.*$/, "")
    .replace(/\(?\s*\b(19|20)\d{2}\b.*$/, "")
);

// "Hotel Manager" is a title even though "Hotel" is a company word — what
// matters is that the text ends in a job-title word.
const isDesignationText = (s) => {
  const t = clean(s).replace(/\s*\(.*\)\s*$/, "");
  if (!DesignationWords.test(t)) return false;
  return !CompanyWords.test(t) || DesignationWords.test(t.split(/\s+/).pop());
};

const CurrentJobRx =/\b(currently|present|presently|till\s*now|working\s+since)\b/i;

const extractDesignationAndCompany = (lines, sections) => {
  const exp = sections.experience?.length ? sections.experience : lines;
  const designationLabels = "current\\s*designation|designation|job\\s*profile|job\\s*title|work(?:ing)?\\s*as|position|role|post";
  const companyLabels = "current\\s*(?:company|employer|organi[sz]ation)|company(?:\\s*name)?|employer|organi[sz]ation|work(?:ing)?\\s*with";
  let designation = labelValue(exp, designationLabels);
  let company = labelValue(exp, companyLabels);
  if (!designation) designation = labelValue(lines, "current\\s*designation|designation");
  if (!company) company = labelValue(lines, "current\\s*(?:company|employer|organi[sz]ation)");

  // "HDFC Securities Ltd Currently Till Date 11/04/2023 (Deputy Manager in Dealing)"
  // — one job per line; prefer the line marked current, else the first one.
  if (!designation || !company) {
    const jobs = [];
    exp.forEach((raw) => {
      const paren = raw.match(/^(.*?)\(\s*([^()]{3,60})\s*\)\s*\.?\s*$/);
      if (!paren || !DesignationWords.test(paren[2])) return;
      const c = stripDates(paren[1]);
      if (c && CompanyWords.test(c)) jobs.push({ company: c, designation: clean(paren[2]), current: CurrentJobRx.test(raw) });
    });
    const pick = jobs.find((j) => j.current) || jobs[0];
    if (pick) {
      designation = designation || pick.designation;
      company = company || pick.company;
    }
  }

  if (!designation || !company) {
    // Look at the job marked "Present" / "Currently" first, then the rest in order
    const ordered = [...exp.filter((l) => CurrentJobRx.test(l)), ...exp.slice(0, 25).filter((l) => !CurrentJobRx.test(l))];
    for (const raw of ordered) {
      const line = stripDates(raw);
      if (!line || line.split(/\s+/).length > 14) continue;
      // "Dealer cum advisor in Tradebulls Securities Pvt. Ltd." / "Sales Manager at HDFC Bank"
      const m = line.match(/^(.{3,60}?)\s+(?:at|in|with|@)\s+(.{3,80})$/i);
      if (m && DesignationWords.test(m[1]) && CompanyWords.test(m[2])) {
        designation = designation || m[1];
        company = company || m[2];
        break;
      }
      // "Sales Manager | HDFC Bank" / "HDFC Bank - Sales Manager"
      const parts = line.split(/\s*\|\s*|\s+[,–—-]\s+/).map(clean).filter(Boolean);
      if (parts.length >= 2) {
        const d = parts.find(isDesignationText);
        const c = parts.find((p) => p !== d && CompanyWords.test(p));
        if (d && c) {
          designation = designation || d;
          company = company || c;
          break;
        }
      }
      if (!designation && isDesignationText(line) && line.split(/\s+/).length <= 7) designation = line;
      else if (!company && CompanyWords.test(line) && line.split(/\s+/).length <= 8 && !DesignationWords.test(line)) company = line;
      if (designation && company) break;
    }
  }

  // Last resort: a title line at the very top ("Relationship Manager" under the name)
  if (!designation) {
    const top = lines.slice(0, 4).map(clean).find((l) => DesignationWords.test(l) && l.split(/\s+/).length <= 5 && !/[@\d]/.test(l));
    if (top) designation = top;
  }

  designation = clean(designation.split(/\s+as\s+(?:in\s+)?(?:role|a|an)\b/i)[0]).replace(/\.$/, "");
  if (designation === designation.toUpperCase()) designation = titleCase(designation);
  company = clean(company).replace(/\s*\(.*$/, "");
  if (company === company.toUpperCase()) company = titleCase(company);
  return {
    currentDesignation: designation.length <= 60 ? designation : "",
    currentCompany: company.length <= 80 ? company : "",
  };
};

const formatCtc = (v) => {
  const s = clean(v);
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(lpa|lakhs?|lacs?|l\b|cr|crores?|k\b|per\s*month|p\.?m\.?|\/-)?/i);
  if (!m) return "";
  const num = m[1].replace(/,/g, "");
  const unit = (m[2] || "").toLowerCase();
  if (/lpa|lakh|lac|^l$/.test(unit)) return `${num} LPA`;
  if (/cr/.test(unit)) return `${num} Cr`;
  if (/k/.test(unit)) return `${num}K`;
  if (/month|p\.?m/.test(unit)) return `${num} per month`;
  return Number(num) < 100 ? `${num} LPA` : num;
};

const extractCtc = (lines, text) => {
  let current = labelValue(lines, "current\\s*ctc|present\\s*ctc|current\\s*salary|present\\s*salary|current\\s*package|ctc");
  if (!current) {
    const m = text.match(/\bctc\s*(?:of|is|:|-)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?\s*(?:lpa|lakhs?|lacs?|l\b|k\b)?)/i);
    if (m) current = m[1];
  }
  const expected = labelValue(lines, "expected\\s*ctc|expected\\s*salary|expected\\s*package");
  return { currentCTC: current ? formatCtc(current) : "", expectedCTC: expected ? formatCtc(expected) : "" };
};

const extractNoticePeriod = (lines, text) => {
  const v = labelValue(lines, "notice\\s*period");
  if (v && v.length < 30) return /immediate/i.test(v) ? "Immediate" : v;
  if (/\bimmediate(ly)?\s+(joiner|joining|available)\b/i.test(text)) return "Immediate";
  return "";
};

const extractSectorCategoryProduct = (text) => {
  const lower = text.toLowerCase();
  let best = null;
  for (const [category, kws] of Object.entries(CategoryKeywords)) {
    let score = 0;
    const productScore = {};
    kws.forEach(([kw, product]) => {
      const n = countWord(lower, kw);
      if (!n) return;
      score += n;
      if (product) productScore[product] = (productScore[product] || 0) + n;
    });
    if (score && (!best || score > best.score)) best = { category, score, productScore };
  }
  if (!best || best.score < 2) return { sector: "", category: "", product: "" };
  const sector = Object.keys(SectorCategories).find((s) => SectorCategories[s].includes(best.category));
  const product = Object.entries(best.productScore).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  return { sector, category: best.category, product };
};

const extractChannel = (text) => {
  let best = null;
  ChannelKeywords.forEach(([channel, kws]) => {
    const score = kws.reduce((sum, kw) => sum + countWord(text, kw), 0);
    if (score && (!best || score > best.score)) best = { channel, score };
  });
  return best ? best.channel : "";
};

// Order matters — "Higher Secondary" must be checked before "Secondary"
const EducationLevels = [
  ["Doctorate", /\b(ph\.?\s?d|doctorate)\b/i],
  ["Post Graduate", /\b(mba|pgdm|pgdba|pgd|m\.?\s?com|m\.?\s?sc|m\.?\s?a\.|m\.?\s?tech|mca|m\.?\s?e\.|master'?s?|post\s*graduat\w*|cfa|ca\b)/i],
  ["Graduate", /\b(b\.?\s?com|b\.?\s?sc|b\.?\s?a\.|bba|bca|bms|b\.?\s?tech|b\.?\s?e\.|b\.?\s?voc|bachelor\w*|graduat\w*|llb)/i],
  ["Diploma", /\bdiploma\b/i],
  ["12th", /\b(12\s?th|xii|hsc|h\.s\.c|higher\s+secondary|intermediate)\b/i],
  ["10th", /\b(10\s?th|ssc|s\.s\.c|secondary\s+school|matric\w*|class\s+x\b)/i],
];
const InstituteWords = /\b(college|collage|university|school|institute|vidyalaya|academy|iim|iit|nmims|campus|board)\b/i;

// A line that ends mid-phrase ("Institute of", "Excel, and") continues on the next line
const EndsMidPhrase = /(\b(of|and|in|for|to|the|with|new|&)|[,&\-])\s*$/i;

// Re-join wrapped lines: "MASTER OF BUSINESS" + "ADMINISTRATION",
// "Shri Chimanbhai Patel Institute of" + "Management & Research"
const joinEducationLines = (lines) => {
  const out = [];
  lines.forEach((line) => {
    const prev = out[out.length - 1];
    const isLevel = (l) => EducationLevels.some(([, rx]) => rx.test(l));
    const capsWrap = prev && isLevel(prev) && prev === prev.toUpperCase() && line === line.toUpperCase() &&
      /^[A-Z &.()]+$/.test(line) && !isLevel(line) && !InstituteWords.test(line) && line.split(/\s+/).length <= 4;
    const phraseWrap = prev && EndsMidPhrase.test(prev) && !BulletStart.test(line) && !/\d{4}/.test(line) && !isLevel(line);
    if (capsWrap || phraseWrap) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  });
  return out;
};

const extractEducation = (sections) => {
  const lines = joinEducationLines(sections.education || []);
  const entries = [];
  lines.forEach((line, i) => {
    const level = EducationLevels.find(([, rx]) => rx.test(line))?.[0];
    if (!level || entries.some((e) => e.level === level)) return;
    const nearby = lines.slice(i, i + 4).join(" ");
    const next = lines.slice(i + 1, i + 3).find((l) =>
      InstituteWords.test(l) && l.split(/\s+/).length >= 2 && !/dropout/i.test(l) && !EducationLevels.some(([, rx]) => rx.test(l)));
    const sameLineInstitute = InstituteWords.test(line) ? line : "";
    const pct = nearby.match(/(\d{2}(?:\.\d{1,2})?)\s*(%|percent|percentile|pr\b)/i) || nearby.match(/c\.?g\.?p\.?a\.?\s*(?:of|[:\-])?\s*(\d{1,2}(?:\.\d{1,2})?)\b/i);
    entries.push({
      level,
      degreeName: clean(line.replace(/\(?\s*\b(19|20)\d{2}\b.*$/, "")).replace(/\($/, "").trim().slice(0, 100),
      institute: clean(next || (sameLineInstitute !== line ? sameLineInstitute : "")).slice(0, 120),
      modeOfEducation: "",
      percentage: pct ? (pct[2] ? `${pct[1]}%` : `${pct[1]} CGPA`) : "",
      specialization: "",
      isHighestEducation: false,
    });
  });
  const rank = EducationLevels.map(([l]) => l);
  entries.sort((a, b) => rank.indexOf(a.level) - rank.indexOf(b.level));
  if (entries.length) entries[0].isHighestEducation = true;
  return entries.slice(0, 6);
};

const SkillCategoryRules = [
  ["Sales", /sales|business development|revenue|cross[- ]sell|target|acquisition|lead generation|client acquisition/i],
  ["Communication", /communicat|presentation|negotiat|interpersonal|public speaking/i],
  ["Leadership", /leader|team|manag|coach|mentor|training|recruit/i],
  ["Compliance", /complian|kyc|aml|regulat|audit|risk/i],
  ["Technical", /excel|word|powerpoint|ms office|tally|erp|crm|sql|python|software|computer|data|analytics|java|html/i],
  ["Product Knowledge", /mutual fund|insurance|equity|loan|derivative|commodity|banking|financial product|investment/i],
];

const extractSkills = (sections) => {
  // Re-join wrapped bullet points: "Quick learner adaptable to new" + "challenges."
  const lines = [];
  (sections.skills || []).forEach((line) => {
    const prev = lines[lines.length - 1];
    if (prev && !BulletStart.test(line) && (EndsMidPhrase.test(prev) || /^[a-z]/.test(line))) lines[lines.length - 1] = `${prev} ${line}`;
    else lines.push(line);
  });
  const names = [];
  lines.forEach((line) => {
    const body = line.includes(":") ? line.split(":").slice(1).join(":") : line;
    splitList(body).forEach((part) => {
      const s = clean(part).replace(/\.$/, "").replace(/^and\s+/i, "");
      const balanced = (s.match(/\(/g) || []).length === (s.match(/\)/g) || []).length;
      if (balanced && s.length >= 2 && s.length <= 60 && s.split(/\s+/).length <= 7 && !names.some((n) => n.toLowerCase() === s.toLowerCase())) names.push(s);
    });
  });
  return names.slice(0, 15).map((name) => ({
    category: SkillCategoryRules.find(([, rx]) => rx.test(name))?.[0] || "Other",
    name,
    description: "",
    proficiencyLevel: "",
    isCoreSkill: false,
  }));
};

// ── Public API ───────────────────────────────────────────────────────────────

// "D H R U V I K  R A N A" → "DHRUVIK RANA"; "E DUCATION" / "P HONE" → "EDUCATION" / "PHONE"
const fixLetterSpacing = (line) => {
  const words = line.split(/\s{2,}/);
  if (words.length && words.every((w) => /^(\S )+\S$/.test(w) || /^\S$/.test(w))) {
    return words.map((w) => w.replace(/ /g, "")).join(" ");
  }
  return line.replace(/^([A-Z]) ([A-Z]{2,}|[a-z]{2,})\b/, "$1$2");
};

export const normalizeResumeText = (text) =>
  String(text || "")
    .replace(/\r/g, "")
    .replace(/[  -​]/g, " ")
    .split("\n")
    .map((l) => fixLetterSpacing(l.replace(/\t/g, "  ").trim()).replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

// Emails sometimes come out of PDFs with stray spaces: "AMITPANDEY 543@ ICLOUD . COM"
const extractEmail = (text, lines) => {
  const direct = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (direct) return direct[0];
  const labelled = lines.find((l) => /e-?\s?mail/i.test(l) && l.includes("@"));
  if (!labelled) return "";
  const squashed = labelled.replace(/^.*?e-?\s?mail\s*(?:id|address)?\s*[:\-–—]*\s*/i, "").replace(/\s+/g, "");
  const m = squashed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : "";
};

/**
 * Parse resume text into { parsedData, candidateProfile } — candidateProfile
 * matches the Resume.candidateProfile schema (minus lastVerified).
 */
export const parseResumeProfile = (rawText) => {
  const text = normalizeResumeText(rawText);
  const lines = text.split("\n");
  const sections = splitSections(lines);

  const { city, state } = extractLocation(lines, sections);
  const { currentDesignation, currentCompany } = extractDesignationAndCompany(lines, sections);
  const { currentCTC, expectedCTC } = extractCtc(lines, text);
  const { sector, category, product } = extractSectorCategoryProduct(text);
  const totalExperience = extractTotalExperience(text, lines, sections);
  const email = extractEmail(text, lines);
  const name = extractName(lines, email);
  const skills = extractSkills(sections).filter((s) => s.name.toLowerCase() !== name.toLowerCase());

  const candidateProfile = {
    personal: {
      gender: extractGender(lines),
      dob: extractDob(lines),
      city,
      state,
      maritalStatus: extractMaritalStatus(lines),
      languages: extractLanguages(lines, sections),
      preferredLocation: labelValue(lines, "preferred\\s*(?:job\\s*)?location").slice(0, 80),
    },
    professional: {
      sector,
      category,
      product,
      // Channel words ("agency", "corporate sales") are only meaningful for a BFSI profile
      channel: category ? extractChannel(text) : "",
      currentDesignation,
      currentDepartment: labelValue(lines, "department|current\\s*department").slice(0, 60),
      currentCompany,
      currentCTC,
      expectedCTC,
      totalExperience,
      roleExperience: "",
      noticePeriod: extractNoticePeriod(lines, text),
      availability: "",
      jobChangeStatus: "",
    },
    skills,
    education: extractEducation(sections),
  };

  const parsedData = {
    name,
    email,
    phone: extractPhone(text),
    skills: skills.map((s) => s.name),
    experience: totalExperience,
    education: candidateProfile.education[0]?.degreeName || "",
    summary: (sections.summary || []).join(" ").slice(0, 300),
  };

  return { parsedData, candidateProfile };
};

/**
 * Build a $set object that fills only the candidateProfile fields that are
 * still empty on `existing`, so a re-upload never overwrites recruiter edits.
 */
export const buildProfileFillOps = (existingProfile = {}, parsedProfile) => {
  const ops = {};
  ["personal", "professional"].forEach((section) => {
    Object.entries(parsedProfile[section] || {}).forEach(([key, value]) => {
      if (value && !existingProfile?.[section]?.[key]) ops[`candidateProfile.${section}.${key}`] = value;
    });
  });
  ["skills", "education"].forEach((key) => {
    if (parsedProfile[key]?.length && !existingProfile?.[key]?.length) ops[`candidateProfile.${key}`] = parsedProfile[key];
  });
  return ops;
};
