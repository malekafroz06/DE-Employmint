import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import JobCard from "../components/JobCard";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "../components/Navbar";
import latestJobsHero from "../assets/Latest jobs.jpeg";

// ── Constants ─────────────────────────────────────────────────────────────────

const JobChannels = [
  "Agency Channel", "Bancassurance", "Direct Sales", "Digital/Online Sales",
  "Broker Channel", "Corporate / Group Channel", "POSP (Point of Sales Person)",
  "Worksite Marketing", "Alternate Channels", "Franchisee/Entrepreneurial",
  "Sub Borker", "IAF", "DSA"
];

const JobCategories = [
  "Stock Market", "Asset Management", "Portfolio Management", "Wealth Management",
  "Alternative Investment", "Investment Banking", "Asset Finance Company (AFC)",
  "Loan Company (LC)", "Microfinance Institution (MFI)", "Housing Finance Company (HFC)",
  "Gold Loan NBFC", "Retail NBFC (Consumer Finance)", "Life Insurance", "General Insurance",
  "Fundamental Analysis", "Technical Analysis", "Quant Analysis", "Algo Trading",
];

const SalaryRanges = [
  { label: "Under ₹3 LPA",   min: 0,       max: 300000 },
  { label: "₹3 - ₹5 LPA",    min: 300000,  max: 500000 },
  { label: "₹5 - ₹8 LPA",    min: 500000,  max: 800000 },
  { label: "₹8 - ₹12 LPA",   min: 800000,  max: 1200000 },
  { label: "₹12 - ₹15 LPA",  min: 1200000, max: 1500000 },
  { label: "₹15 - ₹20 LPA",  min: 1500000, max: 2000000 },
  { label: "₹20 - ₹30 LPA",  min: 2000000, max: 3000000 },
  { label: "Above ₹30 LPA",  min: 3000000, max: Infinity },
];

// ── Component ─────────────────────────────────────────────────────────────────

const JobListing = () => {
  const { isSearched, searchFilter, setSearchFilter, jobs } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const initialLoad = useRef(true);

  // UI state
  const [showFilter, setShowFilter]   = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterJobs, setFilterJobs]   = useState(jobs);
  const [fade, setFade]               = useState(true);
  const [sortBy, setSortBy]           = useState("recent");

  // Filter values
  const [selectedJobCategory,  setSelectedJobCategory]  = useState([]);
  const [selectedCategory,     setSelectedCategory]     = useState([]); // designation
  const [selectedProduct,      setSelectedProduct]      = useState([]);
  const [selectedChannel,      setSelectedChannel]      = useState([]);
  const [selectedLocation,     setSelectedLocation]     = useState([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState([]);
  const [customSalary,         setCustomSalary]         = useState({ min: "", max: "" });
  const [useCustomSalary,      setUseCustomSalary]      = useState(false);

  // "Show all" toggles
  const [showAllJobCategories, setShowAllJobCategories] = useState(false);
  const [showAllDesignations,  setShowAllDesignations]  = useState(false);
  const [showAllProducts,      setShowAllProducts]      = useState(false);
  const [showAllChannels,      setShowAllChannels]      = useState(false);
  const [showAllLocations,     setShowAllLocations]     = useState(false);

  // Collapse state for each filter section
  const [filterStates, setFilterStates] = useState({
    jobCategory: false,
    designation: false,
    product:     false,
    channel:     false,
    salary:      false,
    location:    false,
  });

  // ── Derived lists from DB ──────────────────────────────────────────────────

  const JobLocationsWithRemote = useMemo(() => {
    const all = jobs.flatMap(j =>
      j.location ? j.location.split(",").map(l => l.trim()).filter(Boolean) : []
    );
    return [...new Set(all)].sort();
  }, [jobs]);

  const JobProductsPredefined = useMemo(() => {
    const all = jobs.flatMap(j =>
      Array.isArray(j.product) && j.product.length > 0 ? j.product : []
    );
    return [...new Set(all)].sort();
  }, [jobs]);

  const JobDesignationsPredefined = useMemo(() => {
    const all = jobs.flatMap(j =>
      j.designation && j.designation.trim() ? [j.designation.trim()] : []
    );
    return [...new Set(all)].sort();
  }, [jobs]);

  const allCategories   = [...JobCategories,   "Other"];
  const allChannels     = [...JobChannels,      "Other"];

  // ── Helpers ────────────────────────────────────────────────────────────────

  const isOtherChannel  = ch  => ch  && !JobChannels.includes(ch);
  const isOtherCategory = cat => cat && !JobCategories.includes(cat);

  const toggleFilter = key =>
    setFilterStates(prev => ({ ...prev, [key]: !prev[key] }));

  const clearSalaryFilter = () => {
    setSelectedSalaryRanges([]);
    setCustomSalary({ min: "", max: "" });
    setUseCustomSalary(false);
  };

  const clearAllFilters = () => {
    triggerTransition(() => {
      setSelectedJobCategory([]);
      setSelectedCategory([]);
      setSelectedProduct([]);
      setSelectedChannel([]);
      setSelectedLocation([]);
      setSelectedSalaryRanges([]);
      setCustomSalary({ min: "", max: "" });
      setUseCustomSalary(false);
      setSearchFilter({ title: "", location: "" });
    });
  };

  // ── Sorting ────────────────────────────────────────────────────────────────

  const getSalaryNum = job => {
    const n = Number(job.salary);
    return isNaN(n) ? 0 : n;
  };

  const sortJobs = (list, type) => {
    const copy = [...list];
    if (type === "salary-high") return copy.sort((a, b) => getSalaryNum(b) - getSalaryNum(a));
    if (type === "salary-low")  return copy.sort((a, b) => getSalaryNum(a) - getSalaryNum(b));
    return copy.reverse(); // recent
  };

  // ── Transition helper ──────────────────────────────────────────────────────

  const triggerTransition = (callback, shouldScroll = true) => {
    setFade(false);
    setTimeout(() => {
      callback();
      setFade(true);
      if (shouldScroll && !initialLoad.current) {
        document.getElementById("job-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  };

  // ── Navigation state → pre-select filter ──────────────────────────────────

  useEffect(() => {
    if (location.state?.selectedCategory && location.state?.fromCategoryPage) {
      const name = location.state.selectedCategory;
      if (name === "Other") {
        setSelectedJobCategory(["Other"]);
      } else if (JobCategories.includes(name)) {
        setSelectedJobCategory([name]);
      } else if (JobDesignationsPredefined.includes(name)) {
        setSelectedCategory([name]);
      } else if (JobProductsPredefined.includes(name)) {
        setSelectedProduct([name]);
      } else {
        const inCat  = jobs.some(j => j.jobcategory === name);
        const inProd = jobs.some(j => Array.isArray(j.product) && j.product.includes(name));
        const inDesig = jobs.some(j => j.designation === name);
        if (inCat)   setSelectedJobCategory([name]);
        else if (inProd)  setSelectedProduct([name]);
        else if (inDesig) setSelectedCategory([name]);
        else setSelectedJobCategory([name]);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, jobs, JobDesignationsPredefined, JobProductsPredefined]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  // Prev refs for change detection
  const prevRefs = useRef({});

  useEffect(() => {
    const run = () => {
      const matchDesignation = job => {
        if (selectedCategory.length === 0) return true;
        if (!job.designation) return false;
        return selectedCategory.includes(job.designation.trim());
      };

      const matchProduct = job => {
        if (selectedProduct.length === 0) return true;
        if (Array.isArray(job.product) && job.product.length > 0)
          return selectedProduct.some(p => job.product.includes(p));
        return false;
      };

      const matchLocation = job =>
        selectedLocation.length === 0 ||
        selectedLocation.some(loc =>
          job.location?.split(",").map(l => l.trim()).includes(loc)
        );

      const matchChannel = job => {
        if (selectedChannel.length === 0) return true;
        if (selectedChannel.includes("Other")) return isOtherChannel(job.jobchannel);
        return selectedChannel.includes(job.jobchannel);
      };

      const matchJobCategory = job => {
        if (selectedJobCategory.length === 0) return true;
        if (selectedJobCategory.includes("Other")) return isOtherCategory(job.jobcategory);
        return selectedJobCategory.includes(job.jobcategory);
      };

      const matchSalary = job => {
        const sal = getSalaryNum(job);
        if (useCustomSalary && (customSalary.min || customSalary.max)) {
          const lo = parseFloat(customSalary.min) * 100000 || 0;
          const hi = parseFloat(customSalary.max) * 100000 || Infinity;
          return sal >= lo && sal <= hi;
        }
        if (selectedSalaryRanges.length === 0) return true;
        return selectedSalaryRanges.some(i => {
          const r = SalaryRanges[i];
          return sal >= r.min && sal <= r.max;
        });
      };

      const matchTitle = job =>
        searchFilter.title === "" ||
        job.title.toLowerCase().includes(searchFilter.title.toLowerCase());

      const matchSearchLoc = job =>
        searchFilter.location === "" ||
        job.location?.toLowerCase().includes(searchFilter.location.toLowerCase());

      const filtered = jobs.filter(job =>
        matchDesignation(job) && matchProduct(job)  && matchLocation(job) &&
        matchChannel(job)     && matchJobCategory(job) && matchSalary(job) &&
        matchTitle(job)       && matchSearchLoc(job)
      );

      setFilterJobs(sortJobs(filtered, sortBy));
      setCurrentPage(1);
    };

    if (initialLoad.current) { run(); initialLoad.current = false; }
    else triggerTransition(run, true);
  }, [
    jobs, selectedCategory, selectedProduct, selectedLocation,
    selectedChannel, selectedJobCategory, selectedSalaryRanges,
    customSalary, useCustomSalary, searchFilter, sortBy,
  ]);

  const handlePageChange = p  => triggerTransition(() => setCurrentPage(p));
  const handleSortChange = e  => triggerTransition(() => setSortBy(e.target.value), false);

  // ── Sub-components ─────────────────────────────────────────────────────────

  const FilterSection = ({ title, filterType, options, selectedFilters, onChange, showAll, setShowAll }) => (
    <div className="border-b border-gray-200 pb-4 mb-6 last:border-b-0">
      <div
        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => toggleFilter(filterType)}
      >
        <h4 className="font-bold text-lg text-gray-800">{title}</h4>
        <div className="flex items-center gap-2">
          {selectedFilters.length > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {selectedFilters.length}
            </span>
          )}
          {filterStates[filterType]
            ? <ChevronUp   className="w-5 h-5 text-gray-600" />
            : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </div>
      </div>

      <AnimatePresence>
        {filterStates[filterType] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-4"
          >
            {selectedFilters.length > 0 && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">{selectedFilters.length} selected</span>
                <button onClick={() => onChange([])} className="text-sm text-primary hover:underline">Clear</button>
              </div>
            )}
            <ul className="space-y-3 max-h-48 overflow-y-auto ml-4">
              {options.slice(0, showAll ? options.length : 8).map((opt, i) => (
                <motion.li key={i} className="flex items-center" whileHover={{ x: 3 }}>
                  <input
                    id={`${filterType}-${i}`}
                    type="checkbox"
                    className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                    checked={selectedFilters.includes(opt)}
                    onChange={() => {
                      const next = selectedFilters.includes(opt)
                        ? selectedFilters.filter(x => x !== opt)
                        : [...selectedFilters, opt];
                      onChange(next);
                    }}
                  />
                  <label htmlFor={`${filterType}-${i}`} className="ml-3 text-gray-700 cursor-pointer hover:text-primary transition-colors">
                    {opt}
                  </label>
                </motion.li>
              ))}
            </ul>
            {options.length > 8 && (
              <button onClick={() => setShowAll(!showAll)} className="mt-3 ml-4 text-sm text-primary hover:underline">
                {showAll ? "Show less" : `Show all (${options.length})`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const SalaryFilterSection = () => (
    <div className="border-b border-gray-200 pb-4 mb-6 last:border-b-0">
      <div
        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => toggleFilter("salary")}
      >
        <h4 className="font-bold text-lg text-gray-800">Salary</h4>
        <div className="flex items-center gap-2">
          {(selectedSalaryRanges.length > 0 || useCustomSalary) && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {useCustomSalary ? "1" : selectedSalaryRanges.length}
            </span>
          )}
          {filterStates.salary
            ? <ChevronUp   className="w-5 h-5 text-gray-600" />
            : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </div>
      </div>

      <AnimatePresence>
        {filterStates.salary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            {(selectedSalaryRanges.length > 0 || useCustomSalary) && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">
                  {useCustomSalary ? "Custom range" : `${selectedSalaryRanges.length} selected`}
                </span>
                <button onClick={clearSalaryFilter} className="text-sm text-primary hover:underline">Clear</button>
              </div>
            )}

            {/* Custom range */}
            <div className="mb-4 ml-4">
              <div className="flex items-center mb-2">
                <input
                  id="custom-salary" type="checkbox" checked={useCustomSalary}
                  className="h-4 w-4 text-primary rounded border-gray-300"
                  onChange={e => { setUseCustomSalary(e.target.checked); if (e.target.checked) setSelectedSalaryRanges([]); }}
                />
                <label htmlFor="custom-salary" className="ml-3 text-sm font-medium text-gray-700">
                  Custom Range (in LPA)
                </label>
              </div>
              {useCustomSalary && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" placeholder="Min (LPA)" value={customSalary.min} min="0" step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                      onChange={e => setCustomSalary(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number" placeholder="Max (LPA)" value={customSalary.max} min="0" step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                      onChange={e => setCustomSalary(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Enter salary in Lakhs Per Annum</p>
                </div>
              )}
            </div>

            {/* Predefined ranges */}
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Or select from ranges:</p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {SalaryRanges.map((range, i) => (
                  <motion.li key={i} className="flex items-center" whileHover={{ x: 3 }}>
                    <input
                      id={`salary-${i}`} type="checkbox"
                      className="h-4 w-4 text-primary rounded border-gray-300"
                      checked={selectedSalaryRanges.includes(i)}
                      disabled={useCustomSalary}
                      onChange={() => {
                        const next = selectedSalaryRanges.includes(i)
                          ? selectedSalaryRanges.filter(x => x !== i)
                          : [...selectedSalaryRanges, i];
                        setSelectedSalaryRanges(next);
                        if (next.length > 0) { setUseCustomSalary(false); setCustomSalary({ min: "", max: "" }); }
                      }}
                    />
                    <label
                      htmlFor={`salary-${i}`}
                      className={`ml-3 text-sm cursor-pointer ${useCustomSalary ? "text-gray-400" : "text-gray-700 hover:text-primary"}`}
                    >
                      {range.label}
                    </label>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filterJobs.length / 6);
  const activeFilterCount =
    selectedJobCategory.length + selectedCategory.length + selectedProduct.length +
    selectedChannel.length + selectedLocation.length +
    (selectedSalaryRanges.length > 0 || useCustomSalary ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden mx-2 sm:mx-4 my-4 sm:my-6 lg:mx-8 lg:my-10 rounded-2xl sm:rounded-3xl border-2 border-gray-300">
        <div className="relative w-full" style={{ paddingBottom: "42%" }}>
          <img src={latestJobsHero} alt="Latest Jobs" className="absolute inset-0 w-full h-full object-cover object-center" />
        </div>
      </section>

      <div className="py-8">
        <div className="container mx-auto flex flex-col lg:flex-row max-lg:space-y-8 px-4 lg:px-8">

          {/* ── FILTER SIDEBAR ── */}
          <motion.div
            className="w-full lg:w-1/5 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:overflow-y-auto py-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Mobile toggle */}
            <button
              onClick={() => setShowFilter(p => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg lg:hidden w-full justify-center mb-4"
            >
              {showFilter ? (
                <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>Hide Filters</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/></svg>Show Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</>
              )}
            </button>

            <div className="hidden lg:block h-4" />

            {showFilter && (
              <div className="bg-white shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-gray-800">
                    Filters {activeFilterCount > 0 && <span className="text-sm font-normal text-primary ml-1">({activeFilterCount} active)</span>}
                  </h3>
                  <button onClick={clearAllFilters} className="text-sm text-primary hover:underline font-medium">Clear All</button>
                </div>

                {/* Current search pills */}
                {isSearched && (searchFilter.title !== "" || searchFilter.location !== "") && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-800">Current Search</h4>
                      <button onClick={clearAllFilters} className="text-sm text-primary hover:underline">Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchFilter.title && (
                        <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-sm text-primary">
                          {searchFilter.title}
                          <button onClick={() => setSearchFilter(p => ({ ...p, title: "" }))} className="text-blue-400 hover:text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                          </button>
                        </span>
                      )}
                      {searchFilter.location && (
                        <span className="inline-flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-1 rounded-full text-sm text-green-700">
                          {searchFilter.location}
                          <button onClick={() => setSearchFilter(p => ({ ...p, location: "" }))} className="text-green-500 hover:text-green-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Active category badge */}
                {(selectedJobCategory.length > 0 || selectedCategory.length > 0 || selectedProduct.length > 0) && (
                  <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-red-800">Active Filters</h4>
                      <button
                        onClick={() => { setSelectedJobCategory([]); setSelectedCategory([]); setSelectedProduct([]); }}
                        className="text-sm text-red-600 hover:underline"
                      >Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobCategory.map((c, i) => <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">{c}</span>)}
                      {selectedCategory.map((c, i)    => <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">{c}</span>)}
                      {selectedProduct.map((c, i)     => <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">{c}</span>)}
                    </div>
                  </div>
                )}

                {/* 1. Category */}
                <FilterSection
                  title="Category"
                  filterType="jobCategory"
                  options={allCategories}
                  selectedFilters={selectedJobCategory}
                  onChange={sel => triggerTransition(() => setSelectedJobCategory(sel))}
                  showAll={showAllJobCategories}
                  setShowAll={setShowAllJobCategories}
                />

                {/* 2. Designation */}
                <FilterSection
                  title="Designation"
                  filterType="designation"
                  options={JobDesignationsPredefined}
                  selectedFilters={selectedCategory}
                  onChange={sel => triggerTransition(() => setSelectedCategory(sel))}
                  showAll={showAllDesignations}
                  setShowAll={setShowAllDesignations}
                />

                {/* 3. Product */}
                <FilterSection
                  title="Product"
                  filterType="product"
                  options={JobProductsPredefined}
                  selectedFilters={selectedProduct}
                  onChange={sel => triggerTransition(() => setSelectedProduct(sel))}
                  showAll={showAllProducts}
                  setShowAll={setShowAllProducts}
                />

                {/* 4. Channel */}
                <FilterSection
                  title="Channel"
                  filterType="channel"
                  options={allChannels}
                  selectedFilters={selectedChannel}
                  onChange={sel => triggerTransition(() => setSelectedChannel(sel))}
                  showAll={showAllChannels}
                  setShowAll={setShowAllChannels}
                />

                {/* 5. Salary */}
                <SalaryFilterSection />

                {/* 6. Location */}
                <FilterSection
                  title="Locations"
                  filterType="location"
                  options={JobLocationsWithRemote}
                  selectedFilters={selectedLocation}
                  onChange={sel => triggerTransition(() => setSelectedLocation(sel))}
                  showAll={showAllLocations}
                  setShowAll={setShowAllLocations}
                />
              </div>
            )}
          </motion.div>

          {/* ── JOB LISTING ── */}
          <section className="w-full lg:w-4/5 pl-0 lg:pl-8">

            {/* Mobile search */}
            <div className="lg:hidden mb-6">
              <div className="relative">
                <input
                  type="text" placeholder="Search jobs..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchFilter.title}
                  onChange={e => setSearchFilter({ ...searchFilter, title: e.target.value })}
                />
                <button className="absolute right-3 top-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
                </button>
              </div>
            </div>

            {/* Result count + sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6" id="job-list">
              <p className="text-gray-600 mb-2 sm:mb-0">
                Showing <span className="font-semibold text-gray-900">{filterJobs.length}</span> jobs
                {activeFilterCount > 0 && (
                  <span className="text-sm ml-2 text-gray-500">
                    ({activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied)
                  </span>
                )}
              </p>
              <div className="flex items-center">
                <label htmlFor="sort" className="text-gray-600 mr-2 text-sm">Sort by:</label>
                <select
                  id="sort" value={sortBy} onChange={handleSortChange}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-primary focus:border-primary bg-white"
                >
                  <option value="recent">Most Recent</option>
                  <option value="salary-high">Salary: High to Low</option>
                  <option value="salary-low">Salary: Low to High</option>
                </select>
              </div>
            </div>

            {/* Cards */}
            <div className="relative min-h-[400px]">
              {filterJobs.length === 0 ? (
                <motion.div className="bg-gray-50 rounded-xl p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <h4 className="text-xl font-medium text-gray-700 mb-2">No jobs found</h4>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
                  <button onClick={clearAllFilters} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                    Clear all filters
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
                  layout
                >
                  <AnimatePresence>
                    {filterJobs.slice((currentPage - 1) * 6, currentPage * 6).map((job, i) => (
                      <motion.div
                        key={job._id || i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        layout
                      >
                        <JobCard job={job} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Pagination */}
            {filterJobs.length > 0 && (
              <motion.div
                className="flex items-center justify-center space-x-2 mt-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full ${currentPage === 1 ? "text-gray-300" : "text-primary hover:bg-primary hover:text-white"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i} onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${currentPage === i + 1 ? "bg-primary text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
                  >{i + 1}</button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full ${currentPage === totalPages ? "text-gray-300" : "text-primary hover:bg-primary hover:text-white"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
                </button>
              </motion.div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default JobListing;