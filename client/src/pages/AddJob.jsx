import Quill from "quill";
import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

// Job Channel Options
const JobChannels = [
  "Agency Channel", "Bancassurance", "Direct Sales", "Digital/Online Sales",
  "Broker Channel", "Corporate / Group Channel", "POSP (Point of Sales Person)",
  "Worksite Marketing", "Alternate Channels", "Franchisee/Entrepreneurial",
  "Sub Broker", "IAF", "DSA", "Other"
];

// Job Category Options
const JobCategories = [
  // Capital Market
  "Stock Market",
  "Asset Management",
  "Portfolio Management",
  "Wealth Management",
  "Alternative Investment Fund",
  "Investment Banking",

  // NBFC Sector
  "Asset Finance Company (AFC)",
  "Loan Company (LC)",
  "Microfinance Institution (MFI)",
  "Housing Finance Company (HFC)",
  "Gold Loan NBFC",
  "Retail NBFC (Consumer Finance)",

  // Insurance Sector
  "Life Insurance",
  "General Insurance",

  // Prop Trading
  "Fundamental Analysis",
  "Technical Analysis",
  "Quant Analysis",
  "Algo Trading",

  "Other"
];

// Products per Category
const CategoryProducts = {
  // ── Capital Market ──────────────────────────────────────────────
  "Stock Market": [
    "Equity", "Commodity", "Currency"
  ],
  "Asset Management": [
    "Mutual Fund", "SIP", "ETF"
  ],
  "Portfolio Management": [
    "Discretionary Portfolio Management",
    "Non-Discretionary Portfolio Management"
  ],
  "Wealth Management": [
    "Wealth Planning", "Investment Advisory"
  ],
  "Alternative Investment Fund": [
    "Private Equity", "Venture Capital", "Hedge Funds"
  ],
  "Investment Banking": [
    "IPO Advisory", "M&A", "Capital Raising", "Debt Syndication"
  ],

  // ── NBFC Sector ─────────────────────────────────────────────────
  "Asset Finance Company (AFC)": [
    "Commercial Vehicle Loans",
    "Construction Equipment Loans",
    "Tractor Loan"
  ],
  "Loan Company (LC)": [
    "Personal Loans", "Business Loans", "MSME Loans"
  ],
  "Microfinance Institution (MFI)": [
    "Group Loans", "Small Ticket Loans", "Micro Loans",
    "Women Group Lending", "Rural Credit"
  ],
  "Housing Finance Company (HFC)": [
    "Home Loans",
    "Loan Against Property (LAP)",
    "Affordable Housing Loans"
  ],
  "Gold Loan NBFC": [
    "Gold Loans (Secured Loans)"
  ],
  "Retail NBFC (Consumer Finance)": [
    "Consumer Durable Loans"
  ],

  // ── Insurance Sector ─────────────────────────────────────────────
  "Life Insurance": [
    "Term Plans", "Endowment Plan", "ULIPs"
  ],
  "General Insurance": [
    "Motor Insurance", "Health Insurance", "Travel Insurance",
    "Property Insurance", "Fire Insurance", "Marine Insurance",
    "Burglary Insurance"
  ],

  // ── Prop Trading ─────────────────────────────────────────────────
  "Fundamental Analysis": [
    "Buy Side", "Sell Side"
  ],
  "Technical Analysis": [
    "Derivative", "Non Derivative"
  ],
  "Quant Analysis": [
    "Quant Modeling"
  ],
  "Algo Trading": [
    "Algorithmic Trading Strategies"
  ],

  // ── Fallback ──────────────────────────────────────────────────────
  "Other": []
};

const AddJob = () => {
  const [designation, setDesignation] = useState("");
  // --- Multi-location state ---
  const [locations, setLocations] = useState([]);
  const [locationInput, setLocationInput] = useState("");

  const [level, setLevel] = useState("Fresher");
  const [jobchannel, setJobChannel] = useState("Agency Channel");
  const [jobcategory, setJobCategory] = useState("Stock Market");
  const [selectedProducts, setSelectedProducts] = useState(
    [CategoryProducts["Stock Market"][0]]
  );

  const [noticeperiod, setNoticeperiod] = useState("Immediate Joiner");
  const [department, setDepartment] = useState("");
  const [salary, setSalary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const [showOtherChannel, setShowOtherChannel] = useState(false);
  const [otherChannel, setOtherChannel] = useState("");
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [otherCategory, setOtherCategory] = useState("");

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const { backendUrl, companyToken } = useContext(AppContext);

  // ── Location helpers ──────────────────────────────────────────────────────
  const addLocation = (raw) => {
    const val = raw.trim();
    if (val && !locations.includes(val)) {
      setLocations((prev) => [...prev, val]);
    }
    setLocationInput("");
  };

  const handleLocationKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addLocation(locationInput);
    }
  };

  const removeLocation = (loc) => {
    setLocations((prev) => prev.filter((l) => l !== loc));
  };

  // ── Product (checkbox) helpers ────────────────────────────────────────────
  const handleProductToggle = (p) => {
    setSelectedProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  // ── Category change ───────────────────────────────────────────────────────
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setJobCategory(value);
    // Reset selected products to first item of new category
    const products = CategoryProducts[value] || [];
    setSelectedProducts(products.length > 0 ? [products[0]] : []);
    if (value === "Other") {
      setShowOtherCategory(true);
    } else {
      setShowOtherCategory(false);
      setOtherCategory("");
    }
  };

  // ── Channel change ────────────────────────────────────────────────────────
  const handleChannelChange = (e) => {
    const value = e.target.value;
    setJobChannel(value);
    if (value === "Other") {
      setShowOtherChannel(true);
    } else {
      setShowOtherChannel(false);
      setOtherChannel("");
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const description = quillRef.current ? quillRef.current.root.innerHTML : "";
      const salaryNum = Number(salary);

      if (!designation.trim()) { toast.error("Designation is required"); setFormStep(1); return; }
      if (salaryNum <= 0 || isNaN(salaryNum)) { toast.error("Please enter a valid salary"); setFormStep(1); return; }
      if (locations.length === 0) { toast.error("Please add at least one location"); setFormStep(1); return; }
      if (jobchannel === "Other" && !otherChannel.trim()) { toast.error("Please specify the channel"); setFormStep(2); return; }
      if (jobcategory === "Other" && !otherCategory.trim()) { toast.error("Please specify the category"); setFormStep(2); return; }
      if (selectedProducts.length === 0) { toast.error("Please select at least one product"); setFormStep(2); return; }

      const textContent = quillRef.current ? quillRef.current.getText().trim() : "";
      if (!textContent) { toast.error("Job description is required"); setFormStep(2); return; }

      const finalChannel = jobchannel === "Other" ? otherChannel.trim() : jobchannel;
      const finalCategory = jobcategory === "Other" ? otherCategory.trim() : jobcategory;

     const { data } = await axios.post(
        backendUrl + "/api/company/post-job",
        {
          title: designation.trim(),      // ← keep 'title' key for backend compatibility
          designation: designation.trim(), // ← also save as designation
          description,
          location: locations.join(", "),
          product: selectedProducts,       // ← send as array, not joined string
          level,
          jobchannel: finalChannel,
          jobcategory: finalCategory,
          noticeperiod,
          salary: salaryNum,
          department: department.trim(),
        },
        { headers: { token: companyToken, "Content-Type": "application/json" } }
      );

     if (data.success) {
      toast.success("Job posted successfully!");
      setDesignation("");  // ← was setTitle("") - this was causing the error
      setSalary("");
      setLocations([]);
      setLocationInput("");
      setLevel("Fresher");
      setJobChannel("Agency Channel");
      setJobCategory("Stock Market");  // ← also fix this, "Equity Broking" doesn't exist in JobCategories
      setSelectedProducts([CategoryProducts["Stock Market"][0]]);  // ← match above
      setNoticeperiod("Immediate Joiner");
      setShowOtherChannel(false);
      setOtherChannel("");
      setShowOtherCategory(false);
      setOtherCategory("");
      setDepartment("");
      if (quillRef.current) quillRef.current.root.innerHTML = "";
      setFormStep(1);
    } else {
        toast.error(data.message || "Failed to post job");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to post job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Preview gating ────────────────────────────────────────────────────────
  const moveToPreview = () => {
    if (!quillRef.current) { toast.error("Editor not ready"); return; }
    const textContent = quillRef.current.getText().trim();
    if (!textContent) { toast.error("Please add a job description before previewing"); return; }
    if (jobchannel === "Other" && !otherChannel.trim()) { toast.error("Please specify the channel"); return; }
    if (jobcategory === "Other" && !otherCategory.trim()) { toast.error("Please specify the category"); return; }
    if (selectedProducts.length === 0) { toast.error("Please select at least one product"); return; }
    setFormStep(3);
  };

  // ── Quill init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],
            [{ header: 1 }, { header: 2 }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ size: ["small", false, "large", "huge"] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ["clean"],
            ["link", "image"],
          ],
        },
        placeholder: "Create a detailed job description...",
      });
    }
  }, []);

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const getDisplayChannel = () => (jobchannel === "Other" ? otherChannel : jobchannel);
  const getDisplayCategory = () => (jobcategory === "Other" ? otherCategory : jobcategory);

  const isStep1Valid =
  designation.trim() && Number(salary) > 0 && !isNaN(Number(salary)) && locations.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 mt-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">Post a New Position</h2>
        <p className="text-gray-500 mt-1">Create a job listing to attract the perfect candidates</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Basic Info</span>
          <span className="text-sm font-medium text-gray-700">Job Details</span>
          <span className="text-sm font-medium text-gray-700">Preview & Post</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 ease-in-out"
            style={{ width: `${(formStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={onSubmitHandler} className="relative">
        {/* ── Step 1: Basic Info ── */}
        <motion.div
          className={formStep === 1 ? "block" : "hidden"}
          initial="hidden" animate="visible" variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold mr-3">1</div>
              <h3 className="text-xl font-semibold text-gray-800">Job Basics</h3>
            </div>

            <div className="space-y-6">
              {/* Job Designation */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Branch Manager, Zonal Head, Sales Executive"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                />
                {designation && (
                  <span className="absolute right-3 top-3 text-green-500">✔</span>
                )}
              </div>
            </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary (Annual) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">₹</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 75000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter the annual salary in INR</p>
              </div>

              {/* ── Multi-location input ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Location(s) <span className="text-red-500">*</span>
                </label>
                <div className="w-full min-h-[48px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 flex flex-wrap gap-2 items-center transition-all duration-200">
                  {locations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() => removeLocation(loc)}
                        className="hover:text-red-900 font-bold leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={handleLocationKeyDown}
                    onBlur={() => locationInput.trim() && addLocation(locationInput)}
                    placeholder={locations.length === 0 ? "Type a city and press Enter…" : "Add more…"}
                    className="flex-1 min-w-[160px] outline-none text-sm py-1"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Press Enter or comma to add each location. Add "Remote" for remote work.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              disabled={!isStep1Valid}
              className={`px-6 py-3 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 ${!isStep1Valid ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Continue to Job Details →
            </button>
          </div>
        </motion.div>

        {/* ── Step 2: Job Details ── */}
        <motion.div
          className={formStep === 2 ? "block" : "hidden"}
          initial="hidden" animate="visible" variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold mr-3">2</div>
              <h3 className="text-xl font-semibold text-gray-800">Job Details</h3>
            </div>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <div ref={editorRef} className="w-full border border-gray-300 rounded-lg min-h-48" />
                <p className="mt-1 text-xs text-gray-500">Be specific about responsibilities, requirements, and benefits</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={jobcategory}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white transition-all duration-200"
                  >
                    {JobCategories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {showOtherCategory && (
                    <input
                      type="text"
                      placeholder="Specify category"
                      value={otherCategory}
                      onChange={(e) => setOtherCategory(e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all duration-200"
                    />
                  )}
                </div>

                {/* ── Product checkboxes ── */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs text-gray-400">(select all that apply)</span>
                  </label>
                  {(CategoryProducts[jobcategory] || []).length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {(CategoryProducts[jobcategory] || []).map((p, i) => (
                        <label
                          key={i}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm font-medium transition-all duration-200 select-none ${
                            selectedProducts.includes(p)
                              ? "bg-red-600 border-red-600 text-white"
                              : "bg-white border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={selectedProducts.includes(p)}
                            onChange={() => handleProductToggle(p)}
                          />
                          {selectedProducts.includes(p) && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {p}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Specify product"
                      value={selectedProducts[0] || ""}
                      onChange={(e) => setSelectedProducts([e.target.value])}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all duration-200"
                    />
                  )}
                  {selectedProducts.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {selectedProducts.join(", ")}
                    </p>
                  )}
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white transition-all duration-200"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="Above 5 years">Above 5 years</option>
                  </select>
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={jobchannel}
                    onChange={handleChannelChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white transition-all duration-200"
                  >
                    {JobChannels.map((ch, i) => (
                      <option key={i} value={ch}>{ch}</option>
                    ))}
                  </select>
                  {showOtherChannel && (
                    <input
                      type="text"
                      placeholder="Specify channel"
                      value={otherChannel}
                      onChange={(e) => setOtherChannel(e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all duration-200"
                    />
                  )}
                </div>

                {/* Notice Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
                  <select
                    value={noticeperiod}
                    onChange={(e) => setNoticeperiod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white transition-all duration-200"
                  >
                    <option value="Immediate Joiner">Immediate Joiner</option>
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales, Operations, HR"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all duration-200"
                  />
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setFormStep(1)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all duration-200">
              ← Back
            </button>
            <button type="button" onClick={moveToPreview}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition-all duration-200">
              Preview Job →
            </button>
          </div>
        </motion.div>

        {/* ── Step 3: Preview & Submit ── */}
        <motion.div
          className={formStep === 3 ? "block" : "hidden"}
          initial="hidden" animate="visible" variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold mr-3">3</div>
              <h3 className="text-xl font-semibold text-gray-800">Preview & Post</h3>
            </div>

            <div className="p-6 border border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{designation || "Designation"}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {locations.map((loc) => (
                      <span key={loc} className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">{loc}</span>
                    ))}
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-fuchsia-100 text-fuchsia-800">{getDisplayCategory()}</span>
                    {selectedProducts.map((p) => (
                      <span key={p} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{p}</span>
                    ))}
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">{level}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">{getDisplayChannel()}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{noticeperiod}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">₹{salary ? Number(salary).toLocaleString() : "0"}</span>
                  <p className="text-sm text-gray-500">per year</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Job Description</h4>
                <div className="prose max-w-none">
                  {quillRef.current && (
                    <div dangerouslySetInnerHTML={{ __html: quillRef.current.root.innerHTML }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setFormStep(2)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all duration-200">
              ← Edit Details
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg shadow-md hover:from-red-700 hover:to-red-800 transition-all duration-200 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Posting...
                </span>
              ) : "Post Job ✓"}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default AddJob;