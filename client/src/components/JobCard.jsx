import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { FiCopy, FiShare2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  // Close the share menu when clicking anywhere else
  useEffect(() => {
    if (!shareOpen) return;
    const close = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [shareOpen]);

  const levelMap = {
    "Beginner Level": "Fresher",
    "Intermediate level": "1-3 yrs",
    "Senior level": "Above 5 yrs",
  };

  const noticePeriodMap = {
    "Immediate": "Immediate Joiner",
    "Within a week": "30 days",
    "Within a month": "60 days",
  };

  const getCompanyInitials = (name) => {
    if (!name) return "C";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getCompanyLogoUrl = () => {
    const logo = job.companyId?.logo || job.companyId?.image;
    if (!logo) return null;
    if (logo.startsWith("http")) return logo;
    const path = logo.startsWith("/") ? logo.substring(1) : logo;
    const parts = path.split("/");
    const filename = encodeURIComponent(parts[parts.length - 1]);
    const dir = parts.slice(0, -1).join("/");
    return dir ? `${backendUrl}/${dir}/${filename}` : `${backendUrl}/${filename}`;
  };

  const stripHtmlTags = (html) => {
    return html ? html.replace(/<[^>]*>?/gm, "") : "No description provided";
  };

  const formatSalary = (salary) => {
    if (!salary) return "Salary not disclosed";
    if (typeof salary === "string") return salary;
    if (salary.min && salary.max)
      return `₹${salary.min.toLocaleString()} - ₹${salary.max.toLocaleString()}`;
    if (typeof salary === "number") {
      return `₹${salary.toLocaleString()}`;
    }
    if (salary.amount) {
      return `₹${salary.amount.toLocaleString()}`;
    }
    return "Salary not disclosed";
  };

  // ✅ Get product tags — handles both new (array) and old (designation string) jobs
  const getProductTags = () => {
    if (Array.isArray(job.product) && job.product.length > 0) {
      return job.product;
    }
    if (job.designation && job.designation.trim() !== "") {
      return job.designation.split(",").map((d) => d.trim()).filter(Boolean);
    }
    return [];
  };

  const productTags = getProductTags();

  // ── Share ─────────────────────────────────────────────────────────────────
  const jobLink = `${window.location.origin}/job/${job._id}`;

  // All job details as a ready-to-post message
  const buildShareText = () => {
    const description = stripHtmlTags(job.description).replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const lines = [
      `🚀 We're Hiring: ${job.title || "Job Opening"}`,
      "",
      `🏢 Company: ${job.companyId?.name || "Company"}`,
      `📍 Location: ${job.location || "Remote"}`,
      job.salary && `💰 Salary: ${formatSalary(job.salary)}`,
      `🎯 Experience: ${levelMap[job.level] || job.level || "Fresher"}`,
      job.jobcategory && `📂 Category: ${job.jobcategory}`,
      productTags.length > 0 && `📦 Product: ${productTags.join(", ")}`,
      job.jobchannel && `🔗 Channel: ${job.jobchannel}`,
      job.noticeperiod && `⏳ Notice Period: ${noticePeriodMap[job.noticeperiod] || job.noticeperiod}`,
      description && description !== "No description provided" && "",
      description && description !== "No description provided" &&
        `📝 ${description.length > 400 ? `${description.slice(0, 400)}…` : description}`,
      "",
      `👉 Apply here: ${jobLink}`,
      "",
      "#hiring #jobs #BFSI #DEemploymint",
    ];
    return lines.filter((l) => l !== false && l !== null && l !== undefined).join("\n");
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for browsers / non-HTTPS pages without the Clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  };

  const handleShareClick = async () => {
    const ok = await copyToClipboard(buildShareText());
    if (ok) toast.success("Job details copied! Choose where to share.");
    else toast.error("Couldn't copy automatically — use the share buttons.");
    setShareOpen(true);
  };

  const shareOn = (platform) => {
    const text = buildShareText();
    const url = platform === "linkedin"
      // Opens the LinkedIn post composer with the job details already filled in
      ? `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
      className="h-full"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative group bg-white border border-gray-200 rounded-lg hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col h-full"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                  {job.title || "Job Title"}
                </h3>
                <p className="text-sm text-gray-800 truncate">
                  {job.companyId?.name || "Company"} - {job.location || "Remote"}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0 overflow-hidden relative"
                style={{ backgroundColor: "#ff6666" }}
              >
                <span>{getCompanyInitials(job.companyId?.name)}</span>
                {getCompanyLogoUrl() && (
                  <img
                    src={getCompanyLogoUrl()}
                    alt={job.companyId?.name || "Company"}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2 mb-4 text-xs min-h-[52px] content-start">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium shadow-sm">
            {levelMap[job.level] || job.level || "Fresher"}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium shadow-sm">
            {job.type || "Full-Time"}
          </span>
          {job.salary && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium shadow-sm">
              {formatSalary(job.salary)}
            </span>
          )}
          {job.noticeperiod && job.noticeperiod.toString().trim() !== "" && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium shadow-sm">
              {noticePeriodMap[job.noticeperiod] || job.noticeperiod}
            </span>
          )}
          {job.jobchannel && job.jobchannel.toString().trim() !== "" && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium shadow-sm">
              {job.jobchannel}
            </span>
          )}
          {job.jobcategory && job.jobcategory.toString().trim() !== "" && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium shadow-sm">
              {job.jobcategory}
            </span>
          )}

          {/* ✅ Product tags — works for both old (designation) and new (product array) jobs */}
          {productTags.map((p, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-red-50 text-red-600 rounded font-medium shadow-sm"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Spacer pushes footer to bottom */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-4">
          {/* Buttons Row */}
          <div className="flex justify-between items-center gap-2 mb-3">
            <button
              onClick={() => {
                navigate(`/apply-job/${job._id}`);
                window.scrollTo(0, 0);
              }}
              className="px-4 py-2 text-sm font-medium border border-red-500 text-red-500 rounded transition hover:bg-red-50"
            >
              Description
            </button>

            <button
              onClick={() => {
                navigate(`/apply-job/${job._id}`);
                window.scrollTo(0, 0);
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded transition-colors duration-200 shadow-md hover:shadow-lg"
              style={{ backgroundColor: "#ff0000" }}
            >
              Apply Now
            </button>
          </div>

          {/* Copy job details + share to LinkedIn / WhatsApp */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={handleShareClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded shadow-sm hover:bg-gray-200 transition"
            >
              <FiShare2 size={14} /> Copy Link to Social Media
            </button>

            <AnimatePresence>
              {shareOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-20"
                >
                  <p className="text-xs text-gray-500 mb-2">Job details copied. Share on:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => shareOn("linkedin")}
                      className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-blue-50 text-[#0A66C2] text-xs font-medium transition"
                    >
                      <FaLinkedin size={22} /> LinkedIn
                    </button>
                    <button
                      onClick={() => shareOn("whatsapp")}
                      className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-green-50 text-[#25D366] text-xs font-medium transition"
                    >
                      <FaWhatsapp size={22} /> WhatsApp
                    </button>
                    <button
                      onClick={async () => {
                        if (await copyToClipboard(buildShareText())) toast.success("Copied again");
                        setShareOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-medium transition"
                    >
                      <FiCopy size={20} /> Copy
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

JobCard.defaultProps = {
  job: {
    title: "",
    companyId: { name: "", image: "" },
    location: "",
    level: "",
    jobchannel: "",
    jobcategory: "",
    salary: null,
    type: "",
    description: "",
    product: [],
    designation: "",
    postedAt: null,
    noticeperiod: "",
    _id: "",
  },
};

export default JobCard;