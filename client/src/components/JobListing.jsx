import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { assets, Jobdesignation, JobLocations } from "../assets/assets";
import JobCard from "../components/JobCard";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom"; 
import {ChevronDown, ChevronUp, IndianRupee} from "lucide-react";
import { FiSearch, FiMapPin, FiArrowRight } from "react-icons/fi";

// Job Channel Options (without "Other")
const JobChannels = [
  "Agency Channel",
  "Bancassurance", 
  "Direct Sales",
  "Digital/Online Sales",
  "Broker Channel",
  "Corporate / Group Channel",
  "POSP (Point of Sales Person)",
  "Worksite Marketing",
  "Alternate Channels",
  "Franchisee/Entrepreneurial",
  "Sub Borker",
  "IAF",
  "DSA"
];

// Job Category Options (without "Other")
const JobCategories = [
  "Equity Broking",
  "Commodity Broking", 
  "Currency Broking",
  "Fundamental Research",
  "Technical Research",
  "Data Analysis",
  "Quant Analysis",
  "Life Insurance",
  "General Insurance",
  "Asset Finance",
  "Loan Companies",
  "Microfinance",
  "MFI",
  "Housing Finance Co. (HFC)",
  "Discretionary Portfolio Management",
  "Non-Discretionary Advisory"
];

// Job Designations (predefined only)
const JobDesignationsPredefined = [...Jobdesignation];

// Job Locations with Remote
const JobLocationsWithRemote = [...JobLocations, "Remote"];

// Predefined Salary Ranges in INR
const SalaryRanges = [
  { label: "Under ₹3 LPA", min: 0, max: 300000 },
  { label: "₹3 - ₹5 LPA", min: 300000, max: 500000 },
  { label: "₹5 - ₹8 LPA", min: 500000, max: 800000 },
  { label: "₹8 - ₹12 LPA", min: 800000, max: 1200000 },
  { label: "₹12 - ₹15 LPA", min: 1200000, max: 1500000 },
  { label: "₹15 - ₹20 LPA", min: 1500000, max: 2000000 },
  { label: "₹20 - ₹30 LPA", min: 2000000, max: 3000000 },
  { label: "Above ₹30 LPA", min: 3000000, max: Infinity }
];

const JobListing = () => {
  const { isSearched, searchFilter, setSearchFilter, jobs } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const initialLoad = useRef(true);
  const [showFilter, setShowFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState([]);
  const [selectedJobCategory, setSelectedJobCategory] = useState([]);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showAllDesignations, setShowAllDesignations] = useState(false);
  const [showAllChannels, setShowAllChannels] = useState(false);
  const [showAllJobCategories, setShowAllJobCategories] = useState(false);
  const [filterJobs, setFilterJobs] = useState(jobs);
  const [fade, setFade] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  
  // Salary range filter states
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState([]);
  const [customSalary, setCustomSalary] = useState({ min: '', max: '' });
  const [useCustomSalary, setUseCustomSalary] = useState(false);

  // Filter collapse states
  const [filterStates, setFilterStates] = useState({
    jobCategory: false,
    designation: false,
    channel: false,
    location: false,
    salary: false
  });

  // Helper function to parse salary from job
  const parseSalaryValue = (salaryStr) => {
    if (!salaryStr) return { min: 0, max: 0 };
    
    const cleanStr = salaryStr.toString().replace(/[₹$,]/g, '').trim();
    const numbers = cleanStr.match(/\d+(?:\.\d+)?/g);
    
    if (!numbers || numbers.length === 0) return { min: 0, max: 0 };
    
    const values = numbers.map(num => {
      let value = parseFloat(num);
      const numIndex = cleanStr.indexOf(num);
      const afterNum = cleanStr.substring(numIndex + num.length, numIndex + num.length + 5);
      
      // Check for LPA, Lacs, Lakhs
      if (afterNum.toLowerCase().includes('lpa') || 
          afterNum.toLowerCase().includes('lakh') || 
          afterNum.toLowerCase().includes('lac') ||
          afterNum.includes('L') || afterNum.includes('l')) {
        value = value * 100000;
      } 
      // Check for Thousands
      else if (afterNum.includes('K') || afterNum.includes('k')) {
        value = value * 1000;
      }
      // Check for Crores
      else if (afterNum.toLowerCase().includes('cr')) {
        value = value * 10000000;
      }
      
      return value;
    });
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  // Helper function to check if a value is "Other" (not in predefined list)
  const isOtherDesignation = (designation) => {
    return designation && !JobDesignationsPredefined.includes(designation);
  };

  const isOtherChannel = (channel) => {
    return channel && !JobChannels.includes(channel);
  };

  const isOtherCategory = (category) => {
    return category && !JobCategories.includes(category);
  };

  // Build filter lists (predefined + "Other")
  const allDesignations = [...JobDesignationsPredefined, "Other"];
  const allChannels = [...JobChannels, "Other"];
  const allCategories = [...JobCategories, "Other"];

  // Sorting function
  const sortJobs = (jobs, sortType) => {
    const jobsCopy = [...jobs];
    
    switch (sortType) {
      case 'recent':
        return jobsCopy.reverse();
        
      case 'salary-high':
        return jobsCopy.sort((a, b) => {
          const getSalaryValue = (job) => {
            const salaryStr = job.salary || job.salaryRange || job.package || '';
            const parsed = parseSalaryValue(salaryStr);
            return parsed.max || 0;
          };
          
          return getSalaryValue(b) - getSalaryValue(a);
        });
        
      case 'salary-low':
        return jobsCopy.sort((a, b) => {
          const getSalaryValue = (job) => {
            const salaryStr = job.salary || job.salaryRange || job.package || '';
            const parsed = parseSalaryValue(salaryStr);
            return parsed.min || 0;
          };
          
          return getSalaryValue(a) - getSalaryValue(b);
        });
        
      default:
        return jobsCopy.reverse();
    }
  };

  // Toggle filter section visibility
  const toggleFilter = (filterType) => {
    setFilterStates(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  // Handle category selection from JobCategories page
  useEffect(() => {
    if (location.state?.selectedCategory && location.state?.fromCategoryPage) {
      const categoryName = location.state.selectedCategory;
      
      // Check if it's "Other"
      if (categoryName === "Other") {
        setSelectedJobCategory(["Other"]);
      }
      // Check if it's a job category
      else if (JobCategories.includes(categoryName)) {
        setSelectedJobCategory([categoryName]);
      }
      // Check if it's a designation
      else if (JobDesignationsPredefined.includes(categoryName)) {
        setSelectedCategory([categoryName]);
      }
      else {
        // Fallback: check which field in jobs matches
        const hasJobCategory = jobs.some(job => job.jobcategory === categoryName);
        const hasDesignation = jobs.some(job => job.designation === categoryName);
        
        if (hasJobCategory) {
          setSelectedJobCategory([categoryName]);
        } else if (hasDesignation) {
          setSelectedCategory([categoryName]);
        } else {
          setSelectedJobCategory([categoryName]);
        }
      }

      window.history.replaceState({}, document.title);
    }
  }, [location.state, jobs]);

  // Refs to track previous filter states
  const prevSelectedCategory = useRef(selectedCategory);
  const prevSelectedLocation = useRef(selectedLocation);
  const prevSelectedChannel = useRef(selectedChannel);
  const prevSelectedJobCategory = useRef(selectedJobCategory);
  const prevSelectedSalaryRanges = useRef(selectedSalaryRanges);
  const prevCustomSalary = useRef(customSalary);
  const prevSearchFilter = useRef({ ...searchFilter });

  const triggerTransition = (callback, shouldScroll = true) => {
    setFade(false);
    setTimeout(() => {
      callback();
      setFade(true);
      if (shouldScroll && !initialLoad.current) {
        document.getElementById("job-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 300);
  };

  useEffect(() => {
    const filterJobs = () => {
      
      const matchesCategory = (job) => {
        if (selectedCategory.length === 0) return true;
        
        // Check if "Other" is selected
        if (selectedCategory.includes("Other")) {
          return isOtherDesignation(job.designation);
        }
        
        return selectedCategory.includes(job.designation);
      };

      const matchesLocation = (job) =>
        selectedLocation.length === 0 || selectedLocation.includes(job.location);

      const matchesChannel = (job) => {
        if (selectedChannel.length === 0) return true;
        
        // Check if "Other" is selected
        if (selectedChannel.includes("Other")) {
          return isOtherChannel(job.jobchannel);
        }
        
        return selectedChannel.includes(job.jobchannel);
      };

      const matchesJobCategory = (job) => {
        if (selectedJobCategory.length === 0) return true;
        
        // Check if "Other" is selected
        if (selectedJobCategory.includes("Other")) {
          return isOtherCategory(job.jobcategory);
        }
        
        return selectedJobCategory.includes(job.jobcategory);
      };

      // NEW: Salary filter
      const matchesSalary = (job) => {
        const salaryStr = job.salary || job.salaryRange || job.package || '';
        if (!salaryStr) return true; // If no salary info, show it
        
        const jobSalary = parseSalaryValue(salaryStr);
        
        // If using custom salary range
        if (useCustomSalary && (customSalary.min || customSalary.max)) {
          const minSalary = parseFloat(customSalary.min) * 100000 || 0; // Convert LPA to actual value
          const maxSalary = parseFloat(customSalary.max) * 100000 || Infinity;
          
          // Job matches if its range overlaps with filter range
          return jobSalary.max >= minSalary && jobSalary.min <= maxSalary;
        }
        
        // If using predefined ranges
        if (selectedSalaryRanges.length === 0) return true;
        
        // Check if job salary falls within any selected range
        return selectedSalaryRanges.some(rangeIndex => {
          const range = SalaryRanges[rangeIndex];
          // Job matches if its range overlaps with filter range
          return jobSalary.max >= range.min && jobSalary.min <= range.max;
        });
      };

      const matchesTitle = (job) =>
        searchFilter.title === "" ||
        job.title.toLowerCase().includes(searchFilter.title.toLowerCase());

      const matchesSearchLocation = (job) =>
        searchFilter.location === "" ||
        job.location.toLowerCase().includes(searchFilter.location.toLowerCase());

      const filteredJobs = jobs
        .slice()
        .filter(
          (job) =>
            matchesCategory(job) &&
            matchesLocation(job) &&
            matchesChannel(job) &&
            matchesJobCategory(job) &&
            matchesSalary(job) &&
            matchesTitle(job) &&
            matchesSearchLocation(job)
        );

      const sortedJobs = sortJobs(filteredJobs, sortBy);

      setFilterJobs(sortedJobs);
      setCurrentPage(1);
    };

    const filtersChanged =
      prevSelectedCategory.current !== selectedCategory ||
      prevSelectedLocation.current !== selectedLocation ||
      prevSelectedChannel.current !== selectedChannel ||
      prevSelectedJobCategory.current !== selectedJobCategory ||
      prevSelectedSalaryRanges.current !== selectedSalaryRanges ||
      JSON.stringify(prevCustomSalary.current) !== JSON.stringify(customSalary) ||
      JSON.stringify(prevSearchFilter.current) !== JSON.stringify(searchFilter);

    if (initialLoad.current) {
      filterJobs();
      initialLoad.current = false;
    } else {
      triggerTransition(filterJobs, filtersChanged);
    }

    prevSelectedCategory.current = selectedCategory;
    prevSelectedLocation.current = selectedLocation;
    prevSelectedChannel.current = selectedChannel;
    prevSelectedJobCategory.current = selectedJobCategory;
    prevSelectedSalaryRanges.current = selectedSalaryRanges;
    prevCustomSalary.current = customSalary;
    prevSearchFilter.current = { ...searchFilter };
  }, [jobs, selectedCategory, selectedLocation, selectedChannel, selectedJobCategory, selectedSalaryRanges, customSalary, useCustomSalary, searchFilter, sortBy]);

  const handlePageChange = (newPage) => {
    triggerTransition(() => setCurrentPage(newPage));
  };

  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    triggerTransition(() => setSortBy(newSortBy), false);
  };

  const clearAllFilters = () => {
    triggerTransition(() => {
      setSelectedCategory([]);
      setSelectedLocation([]);
      setSelectedChannel([]);
      setSelectedJobCategory([]);
      setSelectedSalaryRanges([]);
      setCustomSalary({ min: '', max: '' });
      setUseCustomSalary(false);
      setSearchFilter({ title: "", location: "" });
    });
  };

  // Clear salary filter
  const clearSalaryFilter = () => {
    setSelectedSalaryRanges([]);
    setCustomSalary({ min: '', max: '' });
    setUseCustomSalary(false);
  };

  // Format salary display
  const formatSalary = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} LPA`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}K`;
    }
    return `₹${amount}`;
  };

  // Filter Section Component
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
          {filterStates[filterType] ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
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
            <div>
              {selectedFilters.length > 0 && (
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">
                    {selectedFilters.length} selected
                  </span>
                  <button 
                    onClick={() => onChange([])}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              <ul className="space-y-3 max-h-48 overflow-y-auto ml-4">
                {options.slice(0, showAll ? options.length : 8).map((option, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-center"
                    whileHover={{ x: 3 }}
                  >
                    <input
                      className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                      type="checkbox"
                      onChange={() => {
                        const newSelection = selectedFilters.includes(option)
                          ? selectedFilters.filter(item => item !== option)
                          : [...selectedFilters, option];
                        onChange(newSelection);
                      }}
                      checked={selectedFilters.includes(option)}
                      id={`${filterType}-${index}`}
                    />
                    <label 
                      htmlFor={`${filterType}-${index}`} 
                      className="ml-3 text-gray-700 cursor-pointer hover:text-primary transition-colors"
                    >
                      {option}
                    </label>
                  </motion.li>
                ))}
              </ul>
              {options.length > 8 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-3 ml-4 text-sm text-primary hover:underline"
                >
                  {showAll ? 'Show less' : `Show all (${options.length})`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Salary Filter Component
  const SalaryFilterSection = () => (
    <div className="border-b border-gray-200 pb-4 mb-6 last:border-b-0">
      <div 
        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => toggleFilter('salary')}
      >
        <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          Salary
        </h4>
        <div className="flex items-center gap-2">
          {(selectedSalaryRanges.length > 0 || useCustomSalary) && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {useCustomSalary ? '1' : selectedSalaryRanges.length}
            </span>
          )}
          {filterStates.salary ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {filterStates.salary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-4"
          >
            {(selectedSalaryRanges.length > 0 || useCustomSalary) && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">
                  {useCustomSalary ? 'Custom range' : `${selectedSalaryRanges.length} selected`}
                </span>
                <button 
                  onClick={clearSalaryFilter}
                  className="text-sm text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
            
            {/* Custom Salary Range */}
            <div className="mb-4 ml-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="custom-salary"
                  checked={useCustomSalary}
                  onChange={(e) => {
                    setUseCustomSalary(e.target.checked);
                    if (e.target.checked) {
                      setSelectedSalaryRanges([]);
                    }
                  }}
                  className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                />
                <label htmlFor="custom-salary" className="ml-3 text-sm font-medium text-gray-700">
                  Custom Range (in LPA)
                </label>
              </div>
              
              {useCustomSalary && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min (LPA)"
                      value={customSalary.min}
                      onChange={(e) => setCustomSalary(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      min="0"
                      step="0.5"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Max (LPA)"
                      value={customSalary.max}
                      onChange={(e) => setCustomSalary(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Enter salary in Lakhs Per Annum (LPA)</p>
                </div>
              )}
            </div>

            {/* Predefined Ranges */}
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Or select from ranges:</p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {SalaryRanges.map((range, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-center"
                    whileHover={{ x: 3 }}
                  >
                    <input
                      className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                      type="checkbox"
                      onChange={() => {
                        const newSelection = selectedSalaryRanges.includes(index)
                          ? selectedSalaryRanges.filter(item => item !== index)
                          : [...selectedSalaryRanges, index];
                        setSelectedSalaryRanges(newSelection);
                        if (newSelection.length > 0) {
                          setUseCustomSalary(false);
                          setCustomSalary({ min: '', max: '' });
                        }
                      }}
                      checked={selectedSalaryRanges.includes(index)}
                      disabled={useCustomSalary}
                      id={`salary-${index}`}
                    />
                    <label 
                      htmlFor={`salary-${index}`} 
                      className={`ml-3 text-sm cursor-pointer transition-colors ${
                        useCustomSalary ? 'text-gray-400' : 'text-gray-700 hover:text-primary'
                      }`}
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

  return (
    <div className="container mx-auto flex flex-col lg:flex-row max-lg:space-y-8 pb-8 px-4 lg:px-8">
      
      {/* FILTER SIDEBAR */}
      <motion.div 
        className="w-full lg:w-1/5 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setShowFilter(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg lg:hidden w-full justify-center mb-4"
        >
          {showFilter ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Hide Filters
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Show Filters
            </>
          )}
        </button>

        <div className="hidden lg:block">
          <div className="h-4"></div> 
        </div> 

        {showFilter && (
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800">Filters</h3>
              <button 
                onClick={clearAllFilters}
                className="text-sm text-primary hover:underline font-medium"
              >
                Clear All
              </button>
            </div>

            {isSearched && (searchFilter.title !== "" || searchFilter.location !== "") && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">Current Search</h4>
                  <button 
                    onClick={clearAllFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchFilter.title && (
                    <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-sm text-primary">
                      {searchFilter.title}
                      <button
                        onClick={() => setSearchFilter(prev => ({ ...prev, title: "" }))}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {searchFilter.location && (
                    <span className="inline-flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-1 rounded-full text-sm text-green-700">
                      {searchFilter.location}
                      <button
                        onClick={() => setSearchFilter(prev => ({ ...prev, location: "" }))}
                        className="text-green-500 hover:text-green-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {(selectedJobCategory.length > 0 || selectedCategory.length > 0) && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-red-800">Active Category Filter</h4>
                  <button 
                    onClick={() => {
                      setSelectedJobCategory([]);
                      setSelectedCategory([]);
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedJobCategory.map((cat, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                      {cat}
                    </span>
                  ))}
                  {selectedCategory.map((cat, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <FilterSection
              title="Category"
              filterType="jobCategory"
              options={allCategories}
              selectedFilters={selectedJobCategory}
              onChange={(newSelection) => triggerTransition(() => setSelectedJobCategory(newSelection))}
              showAll={showAllJobCategories}
              setShowAll={setShowAllJobCategories}
            />

            <FilterSection
              title="Designation"
              filterType="designation"
              options={allDesignations}
              selectedFilters={selectedCategory}
              onChange={(newSelection) => triggerTransition(() => setSelectedCategory(newSelection))}
              showAll={showAllDesignations}
              setShowAll={setShowAllDesignations}
            />

            <FilterSection
              title="Channel"
              filterType="channel"
              options={allChannels}
              selectedFilters={selectedChannel}
              onChange={(newSelection) => triggerTransition(() => setSelectedChannel(newSelection))}
              showAll={showAllChannels}
              setShowAll={setShowAllChannels}
            />

            <SalaryFilterSection />

            <FilterSection
              title="Locations"
              filterType="location"
              options={JobLocationsWithRemote}
              selectedFilters={selectedLocation}
              onChange={(newSelection) => triggerTransition(() => setSelectedLocation(newSelection))}
              showAll={showAllLocations}
              setShowAll={setShowAllLocations}
            />
          </div>
        )}
      </motion.div>

      {/* JOB LISTING SECTION */}
      <section className="w-full lg:w-4/5 pl-0 lg:pl-8">
        <div className="mb-6">
          <h3 className="font-bold text-3xl md:text-4xl text-gray-900 mb-2" id="job-list">
            Find Jobs
          </h3>
          <p className="text-gray-600 mb-4">Find your dream job from top companies</p>

          {/* Search Bar */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md">
            {/* Desktop Layout */}
            <div className="hidden md:flex flex-row">
              <div className="flex-1 flex items-center px-4 py-3.5 lg:px-6 lg:py-4 border-r border-gray-200">
                <FiSearch className="text-gray-400 text-lg mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  className="w-full text-base border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  value={searchFilter.title}
                  onChange={(e) => setSearchFilter({ ...searchFilter, title: e.target.value })}
                />
              </div>
              <div className="flex-1 flex items-center px-4 py-3.5 lg:px-6 lg:py-4 border-r border-gray-200">
                <FiMapPin className="text-gray-400 text-lg mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Location or remote"
                  className="w-full text-base border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  value={searchFilter.location}
                  onChange={(e) => setSearchFilter({ ...searchFilter, location: e.target.value })}
                />
              </div>
              <button
                className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-6 lg:px-8 py-3.5 lg:py-4 text-sm lg:text-base border-none cursor-pointer flex items-center gap-2 hover:from-red-700 hover:to-red-800 transition-all whitespace-nowrap"
                onClick={() => setSearchFilter({ ...searchFilter })}
              >
                Search Jobs <FiArrowRight />
              </button>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden flex flex-col">
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <FiSearch className="text-gray-400 text-lg mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, keywords..."
                  className="w-full text-base border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  value={searchFilter.title}
                  onChange={(e) => setSearchFilter({ ...searchFilter, title: e.target.value })}
                />
              </div>
              <div className="flex items-center px-4 py-3 border-b border-gray-200">
                <FiMapPin className="text-gray-400 text-lg mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Location or remote"
                  className="w-full text-base border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  value={searchFilter.location}
                  onChange={(e) => setSearchFilter({ ...searchFilter, location: e.target.value })}
                />
              </div>
              <button
                className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-6 py-3.5 text-base border-none cursor-pointer flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 transition-all w-full"
                onClick={() => setSearchFilter({ ...searchFilter })}
              >
                Search Jobs <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <p className="text-gray-600 mb-2 sm:mb-0">
            Showing <span className="font-semibold text-gray-900">{filterJobs.length}</span> jobs
            {(selectedJobCategory.length > 0 || selectedCategory.length > 0 || selectedChannel.length > 0 || selectedLocation.length > 0 || selectedSalaryRanges.length > 0 || useCustomSalary) && (
              <span className="text-sm ml-2">
                (filtered by {[
                  selectedJobCategory.length > 0 ? `${selectedJobCategory.length} categor${selectedJobCategory.length > 1 ? 'ies' : 'y'}` : '',
                  selectedCategory.length > 0 ? `${selectedCategory.length} designation${selectedCategory.length > 1 ? 's' : ''}` : '',
                  selectedChannel.length > 0 ? `${selectedChannel.length} channel${selectedChannel.length > 1 ? 's' : ''}` : '',
                  selectedLocation.length > 0 ? `${selectedLocation.length} location${selectedLocation.length > 1 ? 's' : ''}` : '',
                  (selectedSalaryRanges.length > 0 || useCustomSalary) ? 'salary range' : ''
                ].filter(Boolean).join(', ')})
              </span>
            )}
          </p>
          <div className="flex items-center">
            <label htmlFor="sort" className="text-gray-600 mr-2 text-sm">Sort by:</label>
            <select 
              id="sort" 
              value={sortBy}
              onChange={handleSortChange}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-primary focus:border-primary bg-white"
            >
              <option value="recent">Most Recent</option>
              <option value="salary-high">Salary: High to Low</option>
              <option value="salary-low">Salary: Low to High</option>
            </select>
          </div>
        </div>

        <div className="relative min-h-[400px]">
          {filterJobs.length === 0 ? (
            <motion.div 
              className="bg-gray-50 rounded-xl p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-xl font-medium text-gray-700 mb-2">No jobs found</h4>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <button 
                onClick={clearAllFilters}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <motion.div 
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
              layout
            >
              <AnimatePresence>
                {filterJobs
                  .slice((currentPage - 1) * 12, currentPage * 12)
                  .map((job, index) => (
                    <motion.div
                      key={job.id || index}
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
        {filterJobs.length > 0 && (
              <motion.div 
                className="flex items-center justify-center space-x-2 mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-300' : 'text-primary hover:bg-primary hover:text-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.ceil(filterJobs.length / 12) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                      currentPage === index + 1
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, Math.ceil(filterJobs.length / 12)))}
                  disabled={currentPage === Math.ceil(filterJobs.length / 12)}
                  className={`p-2 rounded-full ${currentPage === Math.ceil(filterJobs.length / 12) ? 'text-gray-300' : 'text-primary hover:bg-primary hover:text-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </motion.div>
            )}
          </section>
        </div>
     
  );
};

export default JobListing;