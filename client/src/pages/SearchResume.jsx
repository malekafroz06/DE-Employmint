import React, { useState, useContext, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiSearch,
  FiDownload,
  FiTrash2,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiCheck,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import AssessmentPopup from "../components/AssessmentPopup";
import CandidateDetailsModal from "../components/CandidateDetailsModal";

// ── Candidate CTC ranges (same style as the job-search Salary filter) ────────
const CtcRanges = [
  { label: "Under ₹3 LPA", min: 0, max: 300000 },
  { label: "₹3 - ₹5 LPA", min: 300000, max: 500000 },
  { label: "₹5 - ₹8 LPA", min: 500000, max: 800000 },
  { label: "₹8 - ₹12 LPA", min: 800000, max: 1200000 },
  { label: "₹12 - ₹15 LPA", min: 1200000, max: 1500000 },
  { label: "₹15 - ₹20 LPA", min: 1500000, max: 2000000 },
  { label: "₹20 - ₹30 LPA", min: 2000000, max: 3000000 },
  { label: "Above ₹30 LPA", min: 3000000, max: Infinity },
];

// Parse a free-text CTC string ("8 LPA", "6.5 lakh", "45000") → annual rupees
const parseCtcToRupees = (raw) => {
  const s = String(raw || "").toLowerCase().replace(/,/g, "").trim();
  if (!s || s === "n/a") return null;
  const num = parseFloat(s.match(/[\d.]+/)?.[0]);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (/cr|crore/.test(s)) return num * 1e7;
  if (/lac|lakh|lpa|\bl\b/.test(s)) return num * 1e5;
  if (/\bk\b/.test(s)) return num * 1e3;
  return num < 100 ? num * 1e5 : num;
};

// Notice-period buckets a recruiter typically filters by
const NoticePeriodBuckets = [
  { label: "Immediate", test: (d) => d === 0 },
  { label: "Up to 30 days", test: (d) => d !== null && d <= 30 },
  { label: "31 - 60 days", test: (d) => d !== null && d > 30 && d <= 60 },
  { label: "61 - 90 days", test: (d) => d !== null && d > 60 && d <= 90 },
  { label: "90+ days", test: (d) => d !== null && d > 90 },
];

// Parse a free-text notice-period string → approximate days
const noticePeriodToDays = (raw) => {
  const s = String(raw || "").toLowerCase().trim();
  if (!s || s === "n/a") return null;
  if (/immediate|any\s*time|anytime|serving|already|no\s*notice|none/.test(s)) return 0;
  const dayMatch = s.match(/(\d+)\s*day/);
  if (dayMatch) return Number(dayMatch[1]);
  const weekMatch = s.match(/(\d+)\s*week/);
  if (weekMatch) return Number(weekMatch[1]) * 7;
  const monthMatch = s.match(/(\d+(?:\.\d+)?)\s*month/);
  if (monthMatch) return Number(monthMatch[1]) * 30;
  const bare = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(bare) && bare > 0 ? bare : null;
};

// Experience buckets for the Experience filter (in years)
const ExperienceBuckets = [
  { label: "Fresher (< 1 year)", min: 0, max: 1 },
  { label: "1 - 3 years", min: 1, max: 3 },
  { label: "3 - 5 years", min: 3, max: 5 },
  { label: "5 - 10 years", min: 5, max: 10 },
  { label: "Above 10 years", min: 10, max: Infinity },
];

// Parse a free-text experience string ("5 years", "2 yrs 6 months", "Fresher") → years
const experienceToYears = (raw) => {
  const s = String(raw || "").toLowerCase().trim();
  if (!s || s === "n/a") return null;
  if (/fresher|no\s*experience/.test(s)) return 0;
  const years = s.match(/(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?|y\b)/);
  const months = s.match(/(\d+(?:\.\d+)?)\s*(?:months?|mos?|m\b)/);
  if (years || months) {
    return (years ? Number(years[1]) : 0) + (months ? Number(months[1]) / 12 : 0);
  }
  const bare = parseFloat(s.match(/\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(bare) ? bare : null;
};

// Age buckets for the Age filter (age is worked out from date of birth)
const AgeBuckets = [
  { label: "18 - 25 years", min: 18, max: 25 },
  { label: "26 - 30 years", min: 26, max: 30 },
  { label: "31 - 35 years", min: 31, max: 35 },
  { label: "36 - 40 years", min: 36, max: 40 },
  { label: "41 - 50 years", min: 41, max: 50 },
  { label: "Above 50 years", min: 51, max: Infinity },
];

// "1992-02-15" → 34 (null when DOB is missing or invalid)
const ageFromDob = (dob) => {
  if (!dob || dob === "N/A") return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age > 0 && age < 100 ? age : null;
};

// Results table pagination
const RESULTS_PER_PAGE = 10;

const initialsOf = (name) =>
  String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

// Table cell text — show a dash instead of "N/A"
const cell = (v) => (v && v !== "N/A" ? v : "—");

// Compact dropdown filter — a button that pops a checkbox list, so all
// filters sit in one horizontal row instead of a sidebar.
const FilterDropdown = ({ title, options, selected, onChange, isOpen, onToggle }) => (
  <div className="relative">
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
        selected.length > 0
          ? "bg-red-50 border-red-300 text-red-700"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {title}
      {selected.length > 0 && (
        <span className="bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">{selected.length}</span>
      )}
      {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
    </button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
        >
          {options.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">No data yet.</p>
          ) : (
            <>
              {selected.length > 0 && (
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">{selected.length} selected</span>
                  <button onClick={() => onChange([])} className="text-xs text-red-600 hover:underline">Clear</button>
                </div>
              )}
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {options.map((option) => (
                  <li key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-red-600 rounded focus:ring-red-500 border-gray-300 flex-shrink-0"
                      checked={selected.includes(option)}
                      onChange={() => {
                        onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
                      }}
                      id={`filt-${title}-${option}`}
                    />
                    <label htmlFor={`filt-${title}-${option}`} className="ml-2 text-sm text-gray-700 cursor-pointer hover:text-red-600 transition-colors truncate">
                      {option}
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const SearchResume = () => {
  const { companyToken, backendUrl } = useContext(AppContext);
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification } = outletContext || {};

  const [combinedData, setCombinedData]           = useState([]);
  const [filteredData, setFilteredData]           = useState([]);
  const [isLoading, setIsLoading]                 = useState(false);
  const [searchQuery, setSearchQuery]             = useState("");
  const [sortBy, setSortBy]                       = useState("date");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectAll, setSelectAll]                 = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal]     = useState(false);

  // ── Top filter bar (same filters as the public job-search page, in one row) ──
  const [selectedCategory, setSelectedCategory]     = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState([]);
  const [selectedProduct, setSelectedProduct]       = useState([]);
  const [selectedChannel, setSelectedChannel]       = useState([]);
  const [selectedLocation, setSelectedLocation]     = useState([]);
  const [selectedJobStatus, setSelectedJobStatus]   = useState([]);
  const [selectedNotice, setSelectedNotice]         = useState([]);
  const [selectedCtc, setSelectedCtc]               = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [selectedAge, setSelectedAge]             = useState([]);
  const [selectedGender, setSelectedGender]         = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null); // only one dropdown open at a time
  const toggleDropdown = (key) => setOpenDropdown((prev) => (prev === key ? null : key));
  const filterBarRef = useRef(null);

  // Close whichever filter dropdown is open when clicking anywhere outside the filter bar
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const uniqueSorted = (arr) => [...new Set(arr.filter((v) => v && v !== "N/A"))].sort();
  const categoryOptions    = uniqueSorted(combinedData.map((c) => c.category));
  const designationOptions = uniqueSorted(combinedData.map((c) => c.currentDesignation));
  // A candidate can have several products saved as "Equity, MF" — list each one separately
  const splitProducts = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
  const productOptions     = uniqueSorted(combinedData.flatMap((c) => splitProducts(c.product)));
  const channelOptions     = uniqueSorted(combinedData.map((c) => c.channel));
  const locationOptions    = uniqueSorted(combinedData.map((c) => c.city));
  const jobStatusOptions   = uniqueSorted(combinedData.map((c) => c.jobChangeStatus));
  const genderOptions      = uniqueSorted(["Male", "Female", ...combinedData.map((c) => c.gender)]);

  const hasActiveFilters =
    selectedCategory.length || selectedDesignation.length || selectedProduct.length ||
    selectedChannel.length || selectedLocation.length || selectedJobStatus.length ||
    selectedNotice.length || selectedCtc.length || selectedExperience.length ||
    selectedAge.length || selectedGender.length;

  const clearAllFilters = () => {
    setSelectedCategory([]); setSelectedDesignation([]); setSelectedProduct([]);
    setSelectedChannel([]); setSelectedLocation([]); setSelectedJobStatus([]);
    setSelectedNotice([]); setSelectedCtc([]); setSelectedExperience([]);
    setSelectedAge([]); setSelectedGender([]);
  };

  useEffect(() => {
    if (companyToken) fetchCombinedData();
  }, [companyToken]);

  useEffect(() => {
    filterAndSortData();
  }, [combinedData, searchQuery, sortBy,
      selectedCategory, selectedDesignation, selectedProduct, selectedChannel,
      selectedLocation, selectedJobStatus, selectedNotice, selectedCtc, selectedExperience,
      selectedAge, selectedGender]);

  // ── Pagination (10 per page) — back to page 1 whenever the search/filters/sort change ──
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy,
      selectedCategory, selectedDesignation, selectedProduct, selectedChannel,
      selectedLocation, selectedJobStatus, selectedNotice, selectedCtc, selectedExperience,
      selectedAge, selectedGender]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / RESULTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * RESULTS_PER_PAGE;
  const pagedData = filteredData.slice(pageStart, pageStart + RESULTS_PER_PAGE);

  // Listen for assessment tab completion → mark candidate as accepted in UI immediately
 useEffect(() => {
  let bc;
  try {
    bc = new BroadcastChannel("application_updates");
    bc.onmessage = (event) => {

      // Any assessment save counts as an edit — refresh "Last edited"
      if (event.data?.type === "ASSESSMENT_UPDATED" || event.data?.type === "APPLICATION_ACCEPTED") {
        const { applicationId, candidateEmail } = event.data;
        const now = new Date().toISOString();
        setCombinedData(prev =>
          prev.map(c =>
            (applicationId && c._id === applicationId) ||
            (candidateEmail && c.email?.toLowerCase() === candidateEmail.toLowerCase())
              ? { ...c, candidateProfile: { ...(c.candidateProfile || {}), lastVerified: now } }
              : c
          )
        );
      }

      if (event.data?.type === "APPLICATION_ACCEPTED") {
        const { applicationId, candidateEmail } = event.data;

        setCombinedData(prev =>
          prev.map(c => {
            // Match by bulk-upload _id (SearchResume candidates)
            if (applicationId && c._id === applicationId) {
              return { ...c, accepted: true, rejected: false };
            }
            // Match by email (when coming from ViewApplications assessment tab)
            if (candidateEmail && c.email?.toLowerCase() === candidateEmail.toLowerCase()) {
              return { ...c, accepted: true, rejected: false };
            }
            return c;
          })
        );
        toast.success("Candidate accepted via assessment.");
      }

      if (event.data?.type === "APPLICATION_REJECTED") {
        const { applicationId, candidateEmail } = event.data;

        setCombinedData(prev =>
          prev.map(c => {
            if (applicationId && c._id === applicationId) {
              return { ...c, rejected: true, accepted: false };
            }
            if (candidateEmail && c.email?.toLowerCase() === candidateEmail.toLowerCase()) {
              return { ...c, rejected: true, accepted: false };
            }
            return c;
          })
        );
        toast.info("Candidate rejected.");
      }

    };
  } catch { /* BroadcastChannel not supported */ }
  return () => { try { bc?.close(); } catch { } };
}, []);

  // ─── Name helpers ────────────────────────────────────────────────────────────

 const extractCandidateName = (text) => {
  if (!text) return "";
  let name = text.replace(/\.(pdf|doc|docx)$/i, "");
  name = name.replace(/[-_]/g, " ");

  // Split CamelCase words: "MalekAfroz" → "Malek Afroz"
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2');

  const keywordsToRemove = [
    'resume','cv','curriculum','vitae','qa','qe','engineer',
    'developer','manager','analyst','tester','consultant',
    'updated','latest','new','final','v1','v2','v3'
  ];
  keywordsToRemove.forEach(kw => {
    name = name.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '');
  });
  name = name.replace(/\s+/g, " ").replace(/\d+/g, "").trim();
  return name.split(' ')
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

  // ─── Fetch ────────────────────────────────────────────────────────────────────
  // Candidate data comes only from the resume itself (auto-parsed on upload)
  // plus recruiter edits — old CSV/Excel sheets are no longer matched in.

  const fetchCombinedData = async () => {
    setIsLoading(true);
    try {
      const resumesRes = await axios.get(`${backendUrl}/api/bulk-upload/files?type=resumes&limit=1000`, {
        headers: { token: companyToken }
      });

      if (resumesRes.data.success) {
        const resumes = (resumesRes.data.data?.files || resumesRes.data.files || []).filter(Boolean);

        const combined = resumes.map(resume => {
          const resumeFileName = resume.originalName || "";
          const candidateName  = resume.parsedData?.name || extractCandidateName(resumeFileName);

          const candidateProfile = resume.candidateProfile || {};
          const cpPersonal = candidateProfile.personal || {};
          const cpPro      = candidateProfile.professional || {};

          return {
            _id:            resume._id,
            rejected:       resume.rejected       || false,
            accepted:       resume.accepted       || false,
            assessmentData: resume.assessmentData || {},
            resumeName:     resumeFileName,
            candidateName,
            candidateProfile,
            email:    resume.parsedData?.email || "N/A",
            phone:    resume.parsedData?.phone || "N/A",
            location: `${cpPersonal.city || ''} ${cpPersonal.state || ''}`.trim() || "N/A",
            skills:   (candidateProfile.skills?.length ? candidateProfile.skills.map(s => s?.name || s).filter(Boolean).join(', ') : null) || (resume.parsedData?.skills?.length ? resume.parsedData.skills.join(', ') : null) || "N/A",
            experience: cpPro.totalExperience || resume.parsedData?.experience || "N/A",
            status:     resume.status,
            fileSize:   resume.fileSize,
            uploadDate: resume.uploadDate || resume.createdAt,
            resumeFile: resume,
            fullName:      candidateName,
            gender:        cpPersonal.gender        || "N/A",
            dob:           cpPersonal.dob           || "N/A",
            city:          cpPersonal.city          || "N/A",
            state:         cpPersonal.state         || "N/A",
            languages:     cpPersonal.languages     || "N/A",
            maritalStatus: cpPersonal.maritalStatus || "N/A",
            sector:             cpPro.sector             || "N/A",
            category:           cpPro.category           || "N/A",
            product:            cpPro.product            || "N/A",
            channel:            cpPro.channel            || "N/A",
            currentDesignation: cpPro.currentDesignation || "N/A",
            currentDepartment:  cpPro.currentDepartment  || "N/A",
            currentCompany:     cpPro.currentCompany     || "N/A",
            currentCTC:    cpPro.currentCTC    || "N/A",
            expectedCTC:   cpPro.expectedCTC   || "N/A",
            noticePeriod:  cpPro.noticePeriod  || "N/A",
            totalExperience: cpPro.totalExperience || "N/A",
            jobChangeStatus: cpPro.jobChangeStatus || "N/A",
          };
        });

        setCombinedData(combined);
      }
    } catch (error) {
      console.error("Error fetching combined data:", error);
      toast.error("Failed to load resume data");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Filter / Sort ────────────────────────────────────────────────────────────

  const filterAndSortData = () => {
    let filtered = combinedData.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.candidateName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        String(item.phone || '').includes(q) ||
        item.sector.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q) ||
        item.channel.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.currentDesignation.toLowerCase().includes(q) ||
        item.currentDepartment.toLowerCase().includes(q) ||
        item.currentCTC.toLowerCase().includes(q) ||
        item.expectedCTC.toLowerCase().includes(q) ||
        item.totalExperience.toLowerCase().includes(q) ||
        item.noticePeriod.toLowerCase().includes(q) ||
        item.languages.toLowerCase().includes(q) ||
        item.jobChangeStatus.toLowerCase().includes(q) ||
        item.maritalStatus.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q);

      const matchesCategory    = selectedCategory.length === 0    || selectedCategory.includes(item.category);
      const matchesDesignation = selectedDesignation.length === 0 || selectedDesignation.includes(item.currentDesignation);
      const matchesProduct     = selectedProduct.length === 0     || splitProducts(item.product).some((p) => selectedProduct.includes(p));
      const matchesChannel     = selectedChannel.length === 0     || selectedChannel.includes(item.channel);
      const matchesLocation    = selectedLocation.length === 0    || selectedLocation.includes(item.city);
      const matchesJobStatus   = selectedJobStatus.length === 0   || selectedJobStatus.includes(item.jobChangeStatus);

      const matchesNotice = selectedNotice.length === 0 || (() => {
        const days = noticePeriodToDays(item.noticePeriod);
        return NoticePeriodBuckets.some((b) => selectedNotice.includes(b.label) && b.test(days));
      })();

      const matchesCtc = selectedCtc.length === 0 || (() => {
        const rupees = parseCtcToRupees(item.currentCTC);
        if (rupees === null) return false;
        return selectedCtc.some((label) => {
          const range = CtcRanges.find((r) => r.label === label);
          return range && rupees >= range.min && rupees < range.max;
        });
      })();

      const matchesExperience = selectedExperience.length === 0 || (() => {
        const years = experienceToYears(item.totalExperience);
        if (years === null) return false;
        return ExperienceBuckets.some((b) => selectedExperience.includes(b.label) && years >= b.min && years < b.max);
      })();

      const matchesAge = selectedAge.length === 0 || (() => {
        const age = ageFromDob(item.dob);
        if (age === null) return false;
        return AgeBuckets.some((b) => selectedAge.includes(b.label) && age >= b.min && age <= b.max);
      })();

      const matchesGender = selectedGender.length === 0 || selectedGender.includes(item.gender);

      return matchesSearch && matchesCategory && matchesDesignation &&
        matchesProduct && matchesChannel && matchesLocation && matchesJobStatus &&
        matchesNotice && matchesCtc && matchesExperience && matchesAge && matchesGender;
    });

    filtered.sort((a, b) => {
      if (sortBy === "name")    return a.candidateName.localeCompare(b.candidateName);
      if (sortBy === "date")    return new Date(b.uploadDate) - new Date(a.uploadDate);
      return 0;
    });

    setFilteredData(filtered);
  };

  // ─── Download helpers ─────────────────────────────────────────────────────────

  const downloadResume = async (resumeFile) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/bulk-upload/download/${resumeFile._id}`,
        { headers: { token: companyToken }, responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', resumeFile.resumeName || resumeFile.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Resume downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download resume");
    }
  };

  const downloadCandidateInfo = (candidate) => {
    try {
      const csvData = [
        ['Field','Value'],
        ['Full Name', candidate.fullName],
        ['Gender', candidate.gender],
        ['Date of Birth', candidate.dob],
        ['Email', candidate.email],
        ['Phone', candidate.phone],
        ['City', candidate.city],
        ['State', candidate.state],
        ['Marital Status', candidate.maritalStatus],
        ['Languages', candidate.languages],
        [''],
        ['Professional Details',''],
        ['Sector', candidate.sector],
        ['Category', candidate.category],
        ['Product', candidate.product],
        ['Channel', candidate.channel],
        ['Current Designation', candidate.currentDesignation],
        ['Current Department', candidate.currentDepartment],
        [''],
        ['Compensation & Experience',''],
        ['Current CTC', candidate.currentCTC],
        ['Total Experience', candidate.totalExperience],
        ['Notice Period', candidate.noticePeriod],
        ['Job Change Status', candidate.jobChangeStatus],
      ];
      const ws = XLSX.utils.aoa_to_sheet(csvData);
      ws['!cols'] = [{ wch: 30 }, { wch: 50 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Candidate Information');
      XLSX.writeFile(wb, `${candidate.candidateName}_Information.xlsx`);
      toast.success("Candidate information downloaded");
    } catch (error) {
      console.error("Download info error:", error);
      toast.error("Failed to download candidate information");
    }
  };

  // ─── Selection helpers ────────────────────────────────────────────────────────

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([]);
      setSelectAll(false);
    } else {
      setSelectedCandidates(filteredData.map(c => c._id));
      setSelectAll(true);
    }
  };

  const downloadSelectedResumes = async () => {
    if (selectedCandidates.length === 0) { toast.warning("Please select at least one candidate"); return; }
    toast.info(`Downloading ${selectedCandidates.length} resume(s)...`);
    for (const id of selectedCandidates) {
      const candidate = combinedData.find(c => c._id === id);
      if (candidate) {
        try {
          await downloadResume(candidate.resumeFile);
          await new Promise(r => setTimeout(r, 500));
        } catch { /* skip failed */ }
      }
    }
    toast.success(`Downloaded ${selectedCandidates.length} resume(s)`);
  };

  const downloadSelectedInformation = () => {
    if (selectedCandidates.length === 0) { toast.warning("Please select at least one candidate"); return; }
    try {
      const selectedData = combinedData.filter(c => selectedCandidates.includes(c._id));
      const excelData = [[
        'Sr. No.','Full Name','Gender','DOB','Email','Phone','City','State',
        'Marital Status','Languages','Sector','Category','Product','Channel',
        'Current Designation','Current Department','Current CTC',
        'Total Experience','Notice Period','Job Change Status'
      ]];
      selectedData.forEach((c, i) => {
        excelData.push([
          i + 1, c.fullName, c.gender, c.dob, c.email, c.phone, c.city, c.state,
          c.maritalStatus, c.languages, c.sector, c.category, c.product, c.channel,
          c.currentDesignation, c.currentDepartment, c.currentCTC,
          c.totalExperience, c.noticePeriod, c.jobChangeStatus
        ]);
      });
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws['!cols'] = excelData[0].map((_, ci) => ({
        wch: Math.min(Math.max(...excelData.map(row => String(row[ci] || '').length)) + 2, 50)
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Candidates');
      XLSX.writeFile(wb, `Selected_Candidates_Information.xlsx`);
      toast.success(`Downloaded information for ${selectedCandidates.length} candidate(s)`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download candidate information");
    }
  };

  const deleteSelectedCandidates = async () => {
    if (selectedCandidates.length === 0) return;
    const count = selectedCandidates.length;
    let deleted = 0;
    for (const id of selectedCandidates) {
      try {
        const { data } = await axios.delete(
          `${backendUrl}/api/bulk-upload/files/${id}?type=resume`,
          { headers: { token: companyToken } }
        );
        if (data.success) deleted++;
      } catch {
        /* skip individual failures */
      }
    }
    setCombinedData(prev => prev.filter(c => !selectedCandidates.includes(c._id)));
    setSelectedCandidates([]);
    setSelectAll(false);
    if (deleted === count) toast.success(`Deleted ${deleted} candidate(s)`);
    else toast.warning(`Deleted ${deleted} of ${count} candidate(s)`);
  };

  // Called by CandidateDetailsModal after a successful save — merges the
  // saved fields (and refreshed candidateProfile) back into table state so
  // the row reflects the edit immediately, without a full refetch.
  const handleCandidateUpdated = (id, patch) => {
    setCombinedData(prev => prev.map(c => (c._id === id ? { ...c, ...patch } : c)));
    setSelectedCandidate(prev => (prev && prev._id === id ? { ...prev, ...patch } : prev));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes','KB','MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ─── Guard ────────────────────────────────────────────────────────────────────

  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh] px-4">
        <div className="text-center">
          <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">Please login as a company first</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">

        {/* ── HEADER ── */}
        <motion.div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: '#020330' }}>
                Search Resume
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Candidate details auto-filled from uploaded resumes
              </p>
            </div>
            <button
              onClick={fetchCombinedData}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={20} />
              <span className="sm:hidden">Refresh Data</span>
            </button>
          </div>
        </motion.div>

        {/* ── SEARCH & FILTER ── */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4">
            <div className="relative flex-1 lg:flex-[2]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, designation, department, category, product, channel, experience, CTC, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Filters — one row */}
          <div ref={filterBarRef} className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            
            <FilterDropdown
              title="Category" options={categoryOptions} selected={selectedCategory}
              onChange={setSelectedCategory} isOpen={openDropdown === "category"} onToggle={() => toggleDropdown("category")}
            />
            <FilterDropdown
              title="Designation" options={designationOptions} selected={selectedDesignation}
              onChange={setSelectedDesignation} isOpen={openDropdown === "designation"} onToggle={() => toggleDropdown("designation")}
            />
            <FilterDropdown
              title="Product" options={productOptions} selected={selectedProduct}
              onChange={setSelectedProduct} isOpen={openDropdown === "product"} onToggle={() => toggleDropdown("product")}
            />
            <FilterDropdown
              title="Channel" options={channelOptions} selected={selectedChannel}
              onChange={setSelectedChannel} isOpen={openDropdown === "channel"} onToggle={() => toggleDropdown("channel")}
            />
            <FilterDropdown
              title="Location" options={locationOptions} selected={selectedLocation}
              onChange={setSelectedLocation} isOpen={openDropdown === "location"} onToggle={() => toggleDropdown("location")}
            />
            <FilterDropdown
              title="Job Change Status" options={jobStatusOptions} selected={selectedJobStatus}
              onChange={setSelectedJobStatus} isOpen={openDropdown === "jobStatus"} onToggle={() => toggleDropdown("jobStatus")}
            />
            <FilterDropdown
              title="Notice Period" options={NoticePeriodBuckets.map((b) => b.label)} selected={selectedNotice}
              onChange={setSelectedNotice} isOpen={openDropdown === "notice"} onToggle={() => toggleDropdown("notice")}
            />
            <FilterDropdown
              title="Current CTC" options={CtcRanges.map((r) => r.label)} selected={selectedCtc}
              onChange={setSelectedCtc} isOpen={openDropdown === "ctc"} onToggle={() => toggleDropdown("ctc")}
            />
            <FilterDropdown
              title="Experience" options={ExperienceBuckets.map((b) => b.label)} selected={selectedExperience}
              onChange={setSelectedExperience} isOpen={openDropdown === "experience"} onToggle={() => toggleDropdown("experience")}
            />
            <FilterDropdown
              title="Age" options={AgeBuckets.map((b) => b.label)} selected={selectedAge}
              onChange={setSelectedAge} isOpen={openDropdown === "age"} onToggle={() => toggleDropdown("age")}
            />
            <FilterDropdown
              title="Gender" options={genderOptions} selected={selectedGender}
              onChange={setSelectedGender} isOpen={openDropdown === "gender"} onToggle={() => toggleDropdown("gender")}
            />
            {hasActiveFilters ? (
              <button onClick={clearAllFilters} className="text-sm text-red-600 hover:underline font-medium ml-1">Clear All</button>
            ) : null}
          </div>

          <p className="text-sm text-gray-600">
            Total uploaded resumes: <span className="font-semibold text-gray-900">{combinedData.length}</span>
          </p>

          {/* Bulk Action Bar */}
          {selectedCandidates.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <FiCheckCircle />
                <span>{selectedCandidates.length} candidate(s) selected</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                <button
                  onClick={downloadSelectedResumes}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <FiDownload /><span>Download Resumes</span>
                </button>
                <button
                  onClick={downloadSelectedInformation}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FiDownload /><span>Download Information</span>
                </button>
                <button
                  onClick={deleteSelectedCandidates}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <FiTrash2 /><span>Delete</span>
                </button>
                <button
                  onClick={() => { setSelectedCandidates([]); setSelectAll(false); }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <FiX /><span>Clear Selection</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── TABLE ── */}
        {isLoading ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-8 text-center">
            <FiRefreshCw className="mx-auto text-4xl text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600 text-sm sm:text-base">Loading resumes...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#020330' }}>
                Results ({filteredData.length})
              </h3>
            </div>

            <div>
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr className="text-[11px] sm:text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-3 px-1.5 sm:px-2 text-center font-semibold w-[3%]">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                    </th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[4%]">No.</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[15%]">Name</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[9%]">Designation</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[8%]">Department</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[8%]">Category</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[8%]">Product</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[8%]">Channel</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[7%]">Experience</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[6%]">CTC</th>
                    <th className="py-3 px-1.5 sm:px-2 text-left font-semibold w-[8%]">Location</th>
                    <th className="py-3 px-1.5 sm:px-2 text-center font-semibold w-[16%]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedData.map((candidate, index) => (
                    <motion.tr
                      key={candidate._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index, 20) * 0.03 }}
                      className={`border-t border-gray-100 transition-colors ${
                        selectedCandidates.includes(candidate._id) ? "bg-red-50/40" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-1.5 sm:px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate._id)}
                          onChange={() => handleSelectCandidate(candidate._id)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </td>

                      {/* Sr. No. */}
                      <td className="py-4 px-1.5 sm:px-2 text-sm font-medium text-gray-500">
                        {pageStart + index + 1}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-1.5 sm:px-2">
                        <button
                          onClick={() => { setSelectedCandidate(candidate); setShowDetailModal(true); }}
                          className="flex items-center gap-2 sm:gap-2.5 text-left w-full min-w-0 group"
                        >
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white font-bold text-[11px] sm:text-xs flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: "#FF0000" }}
                          >
                            {initialsOf(candidate.candidateName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate group-hover:text-red-600 transition-colors">
                              {candidate.candidateName}
                            </p>
                            <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                              {cell(candidate.currentCompany)}
                            </p>
                          </div>
                        </button>
                      </td>

                      {/* Designation */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.currentDesignation)}</span>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.currentDepartment)}</span>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.category)}</span>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.product)}</span>
                      </td>

                      {/* Channel */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.channel)}</span>
                      </td>

                      {/* Experience */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.totalExperience)}</span>
                      </td>

                      {/* CTC */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.currentCTC)}</span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-1.5 sm:px-2 text-xs sm:text-sm text-gray-700">
                        <span className="line-clamp-2 break-words">{cell(candidate.city)}</span>
                      </td>

                      {/* ── ACTION ── */}
                      <td className="py-4 px-1.5 sm:px-2">
                        <div className="flex items-center justify-end flex-wrap gap-0.5">

                          {/* Status pill */}
                          {candidate.rejected ? (
                            <span className="mr-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              Rejected
                            </span>
                          ) : candidate.accepted ? (
                            <span className="mr-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Accepted
                            </span>
                          ) : null}

                          {/* Edit — always visible */}
                          <button
                            onClick={() => { setSelectedCandidate(candidate); setShowDetailModal(true); }}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit candidate details"
                          >
                            <FiEdit2 size={16} />
                          </button>

                          {/* View Assessment — only when accepted */}
                          {candidate.accepted && (
                            <AssessmentPopup candidate={candidate} />
                          )}

                          {/* Download CV — only when pending */}
                          {!candidate.rejected && !candidate.accepted && (
                            <button
                              onClick={() => downloadResume(candidate.resumeFile)}
                              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Download CV"
                            >
                              <FiDownload size={16} />
                            </button>
                          )}

                          {/* Accept / Re-assess — always visible */}
                          <button
                            onClick={() => {
                              const url = `/assessment?email=${encodeURIComponent(candidate.email || '')}&name=${encodeURIComponent(candidate.candidateName || '')}&phone=${encodeURIComponent(candidate.phone || '')}&applicationId=${encodeURIComponent(candidate._id || '')}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={candidate.accepted || candidate.rejected ? "Re-assess candidate" : "Accept (Open Assessment)"}
                          >
                            <FiCheck size={16} />
                          </button>

                          {/* Reject — always visible */}
                          <button
                            onClick={async () => {
                              try {
                                const { data } = await axios.post(
                                  `${backendUrl}/api/bulk-upload/reject/${candidate._id}`,
                                  {},
                                  { headers: { token: companyToken } }
                                );
                                if (data.success) {
                                  setCombinedData(prev =>
                                    prev.map(c => c._id === candidate._id
                                      ? { ...c, rejected: data.data.rejected, accepted: data.data.accepted }
                                      : c
                                    )
                                  );
                                  setSelectedCandidates(prev => prev.filter(id => id !== candidate._id));
                                  toast.info(`${candidate.candidateName} rejected`);
                                }
                              } catch {
                                toast.error("Failed to reject candidate");
                              }
                            }}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <FiX size={16} />
                          </button>

                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredData.length > RESULTS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {pageStart + 1}–{Math.min(pageStart + RESULTS_PER_PAGE, filteredData.length)} of {filteredData.length} resumes
                </p>
                <div className="flex items-center flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    style={{ color: '#020330' }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                      style={
                        page === safePage
                          ? { backgroundColor: '#FF0000', color: '#fff' }
                          : { color: '#020330', border: '1px solid #e5e7eb' }
                      }
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    style={{ color: '#020330' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-12 text-center">
            {searchQuery.trim() || hasActiveFilters ? (
              <>
                <FiSearch size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium mb-1">No results found</p>
                <p className="text-xs sm:text-sm text-gray-400">Try a different keyword</p>
              </>
            ) : (
              <>
                <FiSearch size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium mb-1">No resumes uploaded yet</p>
                <p className="text-xs sm:text-sm text-gray-400">
                  Upload resumes from Bulk Upload to see them here
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>

      {/* ══════════════════════════════════════════════════════════
          EDIT CANDIDATE MODAL — multi-tab (Candidate Info, Personal,
          Professional, Education, Skills, Documents)
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDetailModal && selectedCandidate && (
          <CandidateDetailsModal
            candidate={selectedCandidate}
            backendUrl={backendUrl}
            companyToken={companyToken}
            onClose={() => setShowDetailModal(false)}
            onDownloadResume={downloadResume}
            onDownloadInfo={downloadCandidateInfo}
            onUpdated={handleCandidateUpdated}
          />
        )}
      </AnimatePresence>

    </>
  );
};

export default SearchResume;