import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FiX, FiUser, FiInfo, FiBookOpen, FiAward, FiFileText,
  FiPlus, FiEdit2, FiTrash2, FiSave, FiDownload, FiUpload, FiMail, FiPhone,
} from "react-icons/fi";

// ── Shared option lists (kept in sync with MyProfile.jsx / AddJob.jsx) ───────
const genderOptions = ["Male", "Female", "Other"];
const maritalStatusOptions = ["Single", "Married"];
const jobChangeStatusOptions = ["Actively Looking", "Open to Offers", "Not Looking"];
// Sector → Category → Product, same structure as the Job Categories page / AddJob.jsx
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
const sectorOptions = Object.keys(SectorCategories);

const CategoryProducts = {
  "Stock Market": ["Equity", "Commodity", "Currency"],
  "Asset Management": ["Mutual Fund", "SIP", "ETF"],
  "Portfolio Management": ["Discretionary Portfolio Management", "Non-Discretionary Portfolio Management"],
  "Wealth Management": ["Wealth Planning", "Investment Advisory"],
  "Alternative Investment Fund": ["Private Equity", "Venture Capital", "Hedge Funds"],
  "Investment Banking": ["IPO Advisory", "M&A", "Capital Raising", "Debt Syndication"],
  "Asset Finance Company (AFC)": [
    "Commercial Vehicle Loans", "Construction Equipment Loans", "Tractor Loan",
    "Used Commercial Vehicle Loan", "Car Finance", "Used Car Finance",
    "Passenger Vehicle Finance", "Machinery Finance", "Equipment Finance",
  ],
  "Loan Company (LC)": ["Personal Loans", "Business Loans", "MSME Loans"],
  "Microfinance Institution (MFI)": ["Group Loans", "Small Ticket Loans", "Micro Loans", "Women Group Lending", "Rural Credit"],
  "Housing Finance Company (HFC)": ["Home Loans", "Loan Against Property (LAP)", "Affordable Housing Loans"],
  "Gold Loan NBFC": ["Gold Loans (Secured Loans)"],
  "Retail NBFC (Consumer Finance)": ["Consumer Durable Loans"],
  "Life Insurance": ["Term Plans", "Endowment Plan", "ULIPs"],
  "General Insurance": [
    "Motor Insurance", "Health Insurance", "Travel Insurance", "Property Insurance",
    "Fire Insurance", "Marine Insurance", "Burglary Insurance",
  ],
  "Fundamental Analysis": ["Buy Side", "Sell Side"],
  "Technical Analysis": ["Derivative", "Non Derivative"],
  "Quant Analysis": ["Quant Modeling"],
  "Algo Trading": ["Algorithmic Trading Strategies"],
};

// Keep a previously-saved value selectable even if it isn't in the list
// (e.g. old free-text data from CSV), so opening the form doesn't wipe it.
const withCurrent = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;
const educationLevelOptions = ["10th", "12th", "Diploma", "Graduate", "Post Graduate", "Doctorate", "Other"];
const modeOfEducationOptions = ["Full Time", "Part Time", "Distance / Correspondence", "Online"];
const skillCategoryOptions = ["Sales", "Product Knowledge", "Communication", "Leadership", "Technical", "Compliance", "Other"];
const proficiencyLevelOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];
const hiringStatusOptions = ["Active", "Passive"];

const TABS = [
  { key: "info", label: "Candidate Information", icon: FiUser },
  { key: "personal", label: "Personal Information", icon: FiInfo },
  { key: "professional", label: "Professional Details", icon: FiUser },
  { key: "education", label: "Education Details", icon: FiBookOpen },
  { key: "skills", label: "Skills & Competency", icon: FiAward },
  { key: "documents", label: "Document Attachments", icon: FiFileText },
];

const emptyEducationRow = {
  level: "", degreeName: "", institute: "", modeOfEducation: "", percentage: "", specialization: "", isHighestEducation: false,
};

const emptySkillRow = {
  category: "", name: "", description: "", proficiencyLevel: "", isCoreSkill: false,
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all";

const CandidateDetailsModal = ({ candidate, backendUrl, companyToken, onClose, onUpdated, onDownloadResume, onDownloadInfo }) => {
  const [activeTab, setActiveTab] = useState("info");

  const profile = candidate.candidateProfile || {};

  const [personal, setPersonal] = useState({
    gender: profile.personal?.gender || (candidate.gender !== "N/A" ? candidate.gender : "") || "",
    dob: profile.personal?.dob || (candidate.dob !== "N/A" ? candidate.dob : "") || "",
    city: profile.personal?.city || (candidate.city !== "N/A" ? candidate.city : "") || "",
    state: profile.personal?.state || (candidate.state !== "N/A" ? candidate.state : "") || "",
    maritalStatus: profile.personal?.maritalStatus || (candidate.maritalStatus !== "N/A" ? candidate.maritalStatus : "") || "",
    languages: profile.personal?.languages || (candidate.languages !== "N/A" ? candidate.languages : "") || "",
    preferredLocation: profile.personal?.preferredLocation || "",
  });

  const [professional, setProfessional] = useState({
    sector: profile.professional?.sector || (candidate.sector !== "N/A" ? candidate.sector : "") || "",
    category: profile.professional?.category || (candidate.category !== "N/A" ? candidate.category : "") || "",
    product: profile.professional?.product || (candidate.product !== "N/A" ? candidate.product : "") || "",
    channel: profile.professional?.channel || (candidate.channel !== "N/A" ? candidate.channel : "") || "",
    currentDesignation: profile.professional?.currentDesignation || (candidate.currentDesignation !== "N/A" ? candidate.currentDesignation : "") || "",
    currentDepartment: profile.professional?.currentDepartment || (candidate.currentDepartment !== "N/A" ? candidate.currentDepartment : "") || "",
    currentCompany: profile.professional?.currentCompany || "",
    currentCTC: profile.professional?.currentCTC || (candidate.currentCTC !== "N/A" ? candidate.currentCTC : "") || "",
    expectedCTC: profile.professional?.expectedCTC || (candidate.expectedCTC !== "N/A" ? candidate.expectedCTC : "") || "",
    totalExperience: profile.professional?.totalExperience || (candidate.totalExperience !== "N/A" ? candidate.totalExperience : "") || "",
    roleExperience: profile.professional?.roleExperience || "",
    noticePeriod: profile.professional?.noticePeriod || (candidate.noticePeriod !== "N/A" ? candidate.noticePeriod : "") || "",
    availability: profile.professional?.availability || "",
    jobChangeStatus: profile.professional?.jobChangeStatus || (candidate.jobChangeStatus !== "N/A" ? candidate.jobChangeStatus : "") || "",
    hiringStatus: profile.professional?.hiringStatus || "",
  });

  const [skills, setSkills] = useState(Array.isArray(profile.skills) ? profile.skills : []);
  const [showSkillPopup, setShowSkillPopup] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillBlocks, setSkillBlocks] = useState([emptySkillRow]);

  const [education, setEducation] = useState(Array.isArray(profile.education) ? profile.education : []);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState(null);
  const [educationForm, setEducationForm] = useState(emptyEducationRow);

  const [savingSection, setSavingSection] = useState(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const cvInputRef = useRef(null);

  const authHeaders = { headers: { token: companyToken } };
  const candidateId = candidate._id;

  // ── Save handlers ──────────────────────────────────────────────────────────
  const savePersonal = async () => {
    try {
      setSavingSection("personal");
      const { data } = await axios.patch(`${backendUrl}/api/bulk-upload/candidate/${candidateId}/personal`, personal, authHeaders);
      if (data.success) {
        toast.success("Personal information saved");
        onUpdated?.(candidateId, { candidateProfile: data.data, ...personal });
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save personal information");
    } finally {
      setSavingSection(null);
    }
  };

  const saveProfessional = async () => {
    try {
      setSavingSection("professional");
      const { data } = await axios.patch(`${backendUrl}/api/bulk-upload/candidate/${candidateId}/professional`, professional, authHeaders);
      if (data.success) {
        toast.success("Professional details saved");
        onUpdated?.(candidateId, { candidateProfile: data.data, ...professional });
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save professional details");
    } finally {
      setSavingSection(null);
    }
  };

  // ── Document Attachments: replace CV ──────────────────────────────────────
  const handleCvReplace = async (file) => {
    if (!file) return;
    const allowedExt = /\.(pdf|doc|docx)$/i;
    if (!allowedExt.test(file.name)) {
      toast.error("Please select a PDF, DOC, or DOCX file");
      return;
    }
    try {
      setUploadingCv(true);
      const formData = new FormData();
      formData.append("resumes", file);
      const { data } = await axios.post(
        `${backendUrl}/api/bulk-upload/candidate/${candidateId}/resume`,
        formData,
        { headers: { token: companyToken, "Content-Type": "multipart/form-data" } }
      );
      if (data.success) {
        toast.success("CV updated");
        // The server fills empty fields from the new CV — show them in the open form
        const cp = data.data.candidateProfile || {};
        const fillEmpty = (prev, src = {}) =>
          Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, v || src[k] || ""]));
        setPersonal((prev) => fillEmpty(prev, cp.personal));
        setProfessional((prev) => fillEmpty(prev, cp.professional));
        if (Array.isArray(cp.skills)) setSkills(cp.skills);
        if (Array.isArray(cp.education)) setEducation(cp.education);
        onUpdated?.(candidateId, {
          resumeName: data.data.resumeName,
          fileSize: data.data.fileSize,
          candidateProfile: data.data.candidateProfile,
        });
      } else {
        toast.error(data.message || "Failed to update CV");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update CV");
    } finally {
      setUploadingCv(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  };

  // ── Skills & Competency CRUD ──────────────────────────────────────────────
  const openAddSkill = () => {
    setEditingSkillId(null);
    setSkillBlocks([emptySkillRow]);
    setShowSkillPopup(true);
  };
  const openEditSkill = (row) => {
    setEditingSkillId(row._id);
    setSkillBlocks([{ ...emptySkillRow, ...row }]);
    setShowSkillPopup(true);
  };
  const addSkillBlock = () => setSkillBlocks((prev) => [...prev, emptySkillRow]);
  const removeSkillBlock = (i) => setSkillBlocks((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  const updateSkillBlock = (i, key, value) => {
    setSkillBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)));
  };

  const submitSkillPopup = async () => {
    if (skillBlocks.some((b) => !b.name.trim())) {
      toast.error("Skill Name is required for every entry");
      return;
    }
    try {
      setSavingSection("skills");
      let lastProfile = null;
      if (editingSkillId) {
        const { data } = await axios.put(
          `${backendUrl}/api/bulk-upload/candidate/${candidateId}/skills/${editingSkillId}`,
          skillBlocks[0], authHeaders
        );
        if (!data.success) throw new Error(data.message || "Failed to update skill");
        lastProfile = data.data;
        toast.success("Skill updated");
      } else {
        for (const block of skillBlocks) {
          const { data } = await axios.post(
            `${backendUrl}/api/bulk-upload/candidate/${candidateId}/skills`,
            block, authHeaders
          );
          if (!data.success) throw new Error(data.message || "Failed to add skill");
          lastProfile = data.data;
        }
        toast.success(skillBlocks.length > 1 ? `${skillBlocks.length} skills added` : "Skill added");
      }
      if (lastProfile) {
        setSkills(lastProfile.skills || []);
        onUpdated?.(candidateId, { candidateProfile: lastProfile });
      }
      setShowSkillPopup(false);
      setSkillBlocks([emptySkillRow]);
      setEditingSkillId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save skill(s)");
    } finally {
      setSavingSection(null);
    }
  };

  const deleteSkillRow = async (row) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/bulk-upload/candidate/${candidateId}/skills/${row._id}`, authHeaders
      );
      if (data.success) {
        setSkills(data.data.skills || []);
        onUpdated?.(candidateId, { candidateProfile: data.data });
        toast.success("Skill removed");
      } else toast.error(data.message || "Failed to remove");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove skill");
    }
  };

  // ── Education CRUD ────────────────────────────────────────────────────────
  const openAddEducation = () => {
    setEditingEducationId(null);
    setEducationForm(emptyEducationRow);
    setShowAddEducation(true);
  };
  const openEditEducation = (row) => {
    setEditingEducationId(row._id);
    setEducationForm({ ...emptyEducationRow, ...row });
    setShowAddEducation(true);
  };

  const saveEducationRow = async () => {
    if (!educationForm.level && !educationForm.degreeName) {
      toast.error("Please fill Education Level or Degree Name");
      return;
    }
    try {
      setSavingSection("education");
      if (editingEducationId) {
        const { data } = await axios.put(
          `${backendUrl}/api/bulk-upload/candidate/${candidateId}/education/${editingEducationId}`,
          educationForm, authHeaders
        );
        if (data.success) {
          setEducation(data.data.education || []);
          onUpdated?.(candidateId, { candidateProfile: data.data });
          toast.success("Education entry updated");
        } else toast.error(data.message || "Failed to update");
      } else {
        const { data } = await axios.post(
          `${backendUrl}/api/bulk-upload/candidate/${candidateId}/education`,
          educationForm, authHeaders
        );
        if (data.success) {
          setEducation(data.data.education || []);
          onUpdated?.(candidateId, { candidateProfile: data.data });
          toast.success("Education entry added");
        } else toast.error(data.message || "Failed to add");
      }
      setShowAddEducation(false);
      setEducationForm(emptyEducationRow);
      setEditingEducationId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save education entry");
    } finally {
      setSavingSection(null);
    }
  };

  const deleteEducationRow = async (row) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/bulk-upload/candidate/${candidateId}/education/${row._id}`, authHeaders
      );
      if (data.success) {
        setEducation(data.data.education || []);
        onUpdated?.(candidateId, { candidateProfile: data.data });
        toast.success("Education entry removed");
      } else toast.error(data.message || "Failed to remove");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove education entry");
    }
  };

  // ── Escape key closes modal ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const displayVal = (v) => (v && v !== "N/A" ? v : "—");

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
        className="bg-white w-full h-full sm:rounded-2xl shadow-2xl sm:w-[96vw] sm:max-w-[1600px] sm:h-[94vh] sm:max-h-[94vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ backgroundColor: "#020330" }}
            >
              {candidate.candidateName?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">Edit Candidate — {candidate.candidateName}</h3>
              <p className="text-xs text-gray-500 truncate">
                {candidate.resumeName}
                <span className="mx-1.5">·</span>
                Last edited:{" "}
                <span className="font-medium text-gray-700">
                  {candidate.candidateProfile?.lastVerified
                    ? new Date(candidate.candidateProfile.lastVerified).toLocaleString()
                    : "Never"}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0">
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
          {/* Left tab nav */}
          <div className="sm:w-72 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 bg-gray-50 overflow-x-auto sm:overflow-y-auto">
            <div className="flex sm:flex-col p-2 sm:p-4 gap-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left ${
                      active ? "bg-red-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right content pane */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10">

            {/* ── Candidate Information ── */}
            {activeTab === "info" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-xs text-gray-500 block mb-1">Full Name</label>
                    <p className="text-sm font-semibold text-gray-900">{displayVal(candidate.fullName || candidate.candidateName)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-xs text-gray-500 block mb-1">Email</label>
                    <div className="flex items-center gap-2 text-sm text-gray-900"><FiMail size={13} className="text-red-500" />{displayVal(candidate.email)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-xs text-gray-500 block mb-1">Phone</label>
                    <div className="flex items-center gap-2 text-sm text-gray-900"><FiPhone size={13} className="text-red-500" />{displayVal(candidate.phone)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-xs text-gray-500 block mb-1">Status</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {candidate.accepted ? "Accepted" : candidate.rejected ? "Rejected" : "Pending"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-xs text-gray-500 block mb-1">Last Edited</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {candidate.candidateProfile?.lastVerified
                        ? new Date(candidate.candidateProfile.lastVerified).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Last Edited updates automatically whenever any change is saved for this candidate.</p>
                <p className="text-xs text-gray-400">Name, email and phone come from the uploaded resume and aren&apos;t editable here.</p>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => onDownloadInfo?.(candidate)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiDownload size={14} /> Download Full Information (Excel)
                  </button>
                </div>
              </div>
            )}

            {/* ── Personal Information ── */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="Gender">
                    <select className={inputCls} value={personal.gender} onChange={(e) => setPersonal((p) => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" className={inputCls} value={personal.dob} onChange={(e) => setPersonal((p) => ({ ...p, dob: e.target.value }))} />
                  </Field>
                  <Field label="City">
                    <input type="text" className={inputCls} value={personal.city} onChange={(e) => setPersonal((p) => ({ ...p, city: e.target.value }))} />
                  </Field>
                  <Field label="State">
                    <input type="text" className={inputCls} value={personal.state} onChange={(e) => setPersonal((p) => ({ ...p, state: e.target.value }))} />
                  </Field>
                  <Field label="Marital Status">
                    <select className={inputCls} value={personal.maritalStatus} onChange={(e) => setPersonal((p) => ({ ...p, maritalStatus: e.target.value }))}>
                      <option value="">Select</option>
                      {maritalStatusOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label="Languages">
                    <input type="text" className={inputCls} placeholder="e.g. Hindi, English" value={personal.languages} onChange={(e) => setPersonal((p) => ({ ...p, languages: e.target.value }))} />
                  </Field>
                  <Field label="Preferred Location">
                    <input type="text" className={inputCls} placeholder="e.g. Pune, Bengaluru" value={personal.preferredLocation} onChange={(e) => setPersonal((p) => ({ ...p, preferredLocation: e.target.value }))} />
                  </Field>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={savePersonal} disabled={savingSection === "personal"} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                    <FiSave size={14} /> {savingSection === "personal" ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Professional Details ── */}
            {activeTab === "professional" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="Sector">
                    <select
                      className={inputCls}
                      value={professional.sector}
                      onChange={(e) => setProfessional((p) => ({ ...p, sector: e.target.value, category: "", product: "" }))}
                    >
                      <option value="">Select Sector</option>
                      {withCurrent(sectorOptions, professional.sector).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Category">
                    <select
                      className={inputCls}
                      value={professional.category}
                      disabled={!professional.sector}
                      onChange={(e) => setProfessional((p) => ({ ...p, category: e.target.value, product: "" }))}
                    >
                      <option value="">{professional.sector ? "Select Category" : "Select a sector first"}</option>
                      {withCurrent(SectorCategories[professional.sector] || [], professional.category).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Product">
                    <select
                      className={inputCls}
                      value={professional.product}
                      disabled={!professional.category}
                      onChange={(e) => setProfessional((p) => ({ ...p, product: e.target.value }))}
                    >
                      <option value="">{professional.category ? "Select Product" : "Select a category first"}</option>
                      {withCurrent(CategoryProducts[professional.category] || [], professional.product).map((pr) => <option key={pr} value={pr}>{pr}</option>)}
                    </select>
                  </Field>
                  <Field label="Channel">
                    <input type="text" className={inputCls} value={professional.channel} onChange={(e) => setProfessional((p) => ({ ...p, channel: e.target.value }))} />
                  </Field>
                  <Field label="Current Designation">
                    <input type="text" className={inputCls} value={professional.currentDesignation} onChange={(e) => setProfessional((p) => ({ ...p, currentDesignation: e.target.value }))} />
                  </Field>
                  <Field label="Current Department">
                    <input type="text" className={inputCls} value={professional.currentDepartment} onChange={(e) => setProfessional((p) => ({ ...p, currentDepartment: e.target.value }))} />
                  </Field>
                  <Field label="Company">
                    <input type="text" className={inputCls} placeholder="Current employer" value={professional.currentCompany} onChange={(e) => setProfessional((p) => ({ ...p, currentCompany: e.target.value }))} />
                  </Field>
                  <Field label="Current CTC">
                    <input type="text" className={inputCls} placeholder="e.g. 8 LPA" value={professional.currentCTC} onChange={(e) => setProfessional((p) => ({ ...p, currentCTC: e.target.value }))} />
                  </Field>
                  <Field label="Expected CTC">
                    <input type="text" className={inputCls} placeholder="e.g. 10 LPA" value={professional.expectedCTC} onChange={(e) => setProfessional((p) => ({ ...p, expectedCTC: e.target.value }))} />
                  </Field>
                  <Field label="Total Experience">
                    <input type="text" className={inputCls} placeholder="e.g. 3 years" value={professional.totalExperience} onChange={(e) => setProfessional((p) => ({ ...p, totalExperience: e.target.value }))} />
                  </Field>
                  <Field label="Role Experience">
                    <input type="text" className={inputCls} placeholder="Years in this BFSI role" value={professional.roleExperience} onChange={(e) => setProfessional((p) => ({ ...p, roleExperience: e.target.value }))} />
                  </Field>
                  <Field label="Notice Period">
                    <input type="text" className={inputCls} placeholder="e.g. 30 days" value={professional.noticePeriod} onChange={(e) => setProfessional((p) => ({ ...p, noticePeriod: e.target.value }))} />
                  </Field>
                  <Field label="Availability">
                    <input type="text" className={inputCls} placeholder="e.g. Immediate, 15 days" value={professional.availability} onChange={(e) => setProfessional((p) => ({ ...p, availability: e.target.value }))} />
                  </Field>
                  <Field label="Job Change Status">
                    <select className={inputCls} value={professional.jobChangeStatus} onChange={(e) => setProfessional((p) => ({ ...p, jobChangeStatus: e.target.value }))}>
                      <option value="">Select</option>
                      {jobChangeStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Hiring Status">
                    <select className={inputCls} value={professional.hiringStatus} onChange={(e) => setProfessional((p) => ({ ...p, hiringStatus: e.target.value }))}>
                      <option value="">Select</option>
                      {hiringStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={saveProfessional} disabled={savingSection === "professional"} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                    <FiSave size={14} /> {savingSection === "professional" ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Education Details ── */}
            {activeTab === "education" && (
              <div>
                <div className="flex justify-end mb-3">
                  <button onClick={openAddEducation} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                    <FiPlus size={14} /> Add
                  </button>
                </div>

                {showAddEducation && (
                  <div className="mb-4 p-4 border border-red-200 bg-red-50/40 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Education Level">
                      <select className={inputCls} value={educationForm.level} onChange={(e) => setEducationForm((f) => ({ ...f, level: e.target.value }))}>
                        <option value="">Select</option>
                        {educationLevelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </Field>
                    <Field label="Degree Name">
                      <input type="text" className={inputCls} value={educationForm.degreeName} onChange={(e) => setEducationForm((f) => ({ ...f, degreeName: e.target.value }))} />
                    </Field>
                    <Field label="University / Institute">
                      <input type="text" className={inputCls} value={educationForm.institute} onChange={(e) => setEducationForm((f) => ({ ...f, institute: e.target.value }))} />
                    </Field>
                    <Field label="Mode of Education">
                      <select className={inputCls} value={educationForm.modeOfEducation} onChange={(e) => setEducationForm((f) => ({ ...f, modeOfEducation: e.target.value }))}>
                        <option value="">Select</option>
                        {modeOfEducationOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Percentage / Grade">
                      <input type="text" className={inputCls} value={educationForm.percentage} onChange={(e) => setEducationForm((f) => ({ ...f, percentage: e.target.value }))} />
                    </Field>
                    <Field label="Specialization">
                      <input type="text" className={inputCls} value={educationForm.specialization} onChange={(e) => setEducationForm((f) => ({ ...f, specialization: e.target.value }))} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                      <input type="checkbox" checked={educationForm.isHighestEducation} onChange={(e) => setEducationForm((f) => ({ ...f, isHighestEducation: e.target.checked }))} />
                      Mark as Highest Education
                    </label>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                      <button onClick={() => { setShowAddEducation(false); setEditingEducationId(null); }} className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                      <button onClick={saveEducationRow} disabled={savingSection === "education"} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                        {editingEducationId ? "Update" : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead className="bg-gray-50">
                      <tr className="text-xs uppercase tracking-wide text-gray-500">
                        <th className="text-left px-3 py-2.5">S.No</th>
                        <th className="text-left px-3 py-2.5">Education Level</th>
                        <th className="text-left px-3 py-2.5">Degree Name</th>
                        <th className="text-left px-3 py-2.5">University / Institute</th>
                        <th className="text-left px-3 py-2.5">Mode</th>
                        <th className="text-left px-3 py-2.5">Percentage / Grade</th>
                        <th className="text-left px-3 py-2.5">Specialization</th>
                        <th className="text-left px-3 py-2.5">Highest</th>
                        <th className="text-center px-3 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {education.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No Data Found — click &quot;Add&quot; to enter education details.</td>
                        </tr>
                      ) : (
                        education.map((row, i) => (
                          <tr key={row._id || i} className="border-t border-gray-100">
                            <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2.5">{row.level || "—"}</td>
                            <td className="px-3 py-2.5">{row.degreeName || "—"}</td>
                            <td className="px-3 py-2.5">{row.institute || "—"}</td>
                            <td className="px-3 py-2.5">{row.modeOfEducation || "—"}</td>
                            <td className="px-3 py-2.5">{row.percentage || "—"}</td>
                            <td className="px-3 py-2.5">{row.specialization || "—"}</td>
                            <td className="px-3 py-2.5">{row.isHighestEducation ? "Yes" : "—"}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openEditEducation(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><FiEdit2 size={14} /></button>
                                <button onClick={() => deleteEducationRow(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><FiTrash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Skills & Competency ── */}
            {activeTab === "skills" && (
              <div>
                <div className="flex justify-end mb-3">
                  <button onClick={openAddSkill} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                    <FiPlus size={14} /> Add
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead className="bg-gray-50">
                      <tr className="text-xs uppercase tracking-wide text-gray-500">
                        <th className="text-left px-3 py-2.5">S.No</th>
                        <th className="text-left px-3 py-2.5">Skill Category</th>
                        <th className="text-left px-3 py-2.5">Skill Name</th>
                        <th className="text-left px-3 py-2.5">Skill Description</th>
                        <th className="text-left px-3 py-2.5">Proficiency Level</th>
                        <th className="text-left px-3 py-2.5">Core Skill</th>
                        <th className="text-left px-3 py-2.5">Created Date</th>
                        <th className="text-center px-3 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skills.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No Data Found — click &quot;Add&quot; to enter skills.</td>
                        </tr>
                      ) : (
                        skills.map((row, i) => (
                          <tr key={row._id || i} className="border-t border-gray-100">
                            <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2.5">{row.category || "—"}</td>
                            <td className="px-3 py-2.5 font-medium text-gray-800">{row.name || "—"}</td>
                            <td className="px-3 py-2.5 max-w-[220px] truncate" title={row.description}>{row.description || "—"}</td>
                            <td className="px-3 py-2.5">{row.proficiencyLevel || "—"}</td>
                            <td className="px-3 py-2.5">{row.isCoreSkill ? "Yes" : "—"}</td>
                            <td className="px-3 py-2.5 text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openEditSkill(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><FiEdit2 size={14} /></button>
                                <button onClick={() => deleteSkillRow(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><FiTrash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Document Attachments ── */}
            {activeTab === "documents" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <FiFileText className="text-red-500 flex-shrink-0" size={22} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{candidate.resumeName || "Resume"}</p>
                      <p className="text-xs text-gray-500">{candidate.fileSize ? `${(candidate.fileSize / 1024).toFixed(0)} KB` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onDownloadResume?.(candidate.resumeFile)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <FiDownload size={14} /> Download
                    </button>
                    <button
                      onClick={() => cvInputRef.current?.click()}
                      disabled={uploadingCv}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-60"
                    >
                      <FiUpload size={14} /> {uploadingCv ? "Uploading..." : "Replace CV"}
                    </button>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleCvReplace(e.target.files?.[0])}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Replacing the CV keeps this candidate&apos;s record and download link the same — only the file changes. Additional document uploads (ID proof, certificates, etc.) aren&apos;t supported yet.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Add / Edit Skill popup ── */}
      {showSkillPopup && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowSkillPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <FiPlus className="text-blue-600" size={18} />
                <h3 className="text-base font-bold text-gray-900">Skills</h3>
              </div>
              <div className="flex items-center gap-2">
                {!editingSkillId && (
                  <button onClick={addSkillBlock} className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700" title="Add another skill">
                    <FiPlus size={14} />
                  </button>
                )}
                <button onClick={() => setShowSkillPopup(false)} className="p-1.5 hover:bg-gray-200 rounded-lg">
                  <FiX size={16} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {skillBlocks.map((block, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-xl relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800">Skill {i + 1}</p>
                    {skillBlocks.length > 1 && (
                      <button onClick={() => removeSkillBlock(i)} className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-lg" title="Remove">
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Skill Category *">
                      <select className={inputCls} value={block.category} onChange={(e) => updateSkillBlock(i, "category", e.target.value)}>
                        <option value="">Select</option>
                        {skillCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Skill Name *">
                      <input type="text" maxLength={50} placeholder="Max 50 characters" className={inputCls} value={block.name} onChange={(e) => updateSkillBlock(i, "name", e.target.value)} />
                    </Field>
                    <Field label="Is Core Skill">
                      <select className={inputCls} value={block.isCoreSkill ? "Yes" : "No"} onChange={(e) => updateSkillBlock(i, "isCoreSkill", e.target.value === "Yes")}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </Field>
                    <Field label="Proficiency Level *">
                      <select className={inputCls} value={block.proficiencyLevel} onChange={(e) => updateSkillBlock(i, "proficiencyLevel", e.target.value)}>
                        <option value="">Select</option>
                        {proficiencyLevelOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Remark / Notes">
                        <textarea maxLength={200} placeholder="Max 200 characters" rows={3} className={inputCls} value={block.description} onChange={(e) => updateSkillBlock(i, "description", e.target.value)} />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowSkillPopup(false)} className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={submitSkillPopup} disabled={savingSection === "skills"} className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                {savingSection === "skills" ? "Saving..." : "Submit"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CandidateDetailsModal;
