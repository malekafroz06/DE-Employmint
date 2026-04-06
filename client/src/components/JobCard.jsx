import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative group bg-white border border-gray-200 rounded-lg hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-300 p-6"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {job.title || "Job Title"}
                </h3>
                <p className="text-sm text-gray-800">
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
        <div className="flex flex-wrap gap-2 mb-4 text-xs">
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
        </div>

        {/* Description */}
        <div className="mb-4">
          <p
            className={`text-sm text-gray-600 leading-relaxed ${
              isExpanded ? "" : "line-clamp-2"
            } cursor-pointer hover:text-gray-900`}
            onClick={() => setIsExpanded(!isExpanded)}
            title="Click to expand"
          >
            {stripHtmlTags(job.description)}
          </p>
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 3).map((skill, index) => (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 font-medium shadow-sm"
                >
                  {skill}
                </motion.span>
              ))}
              {job.skills.length > 3 && (
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 shadow-sm">
                  +{job.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

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

          {/* Copy Link (below) */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/job/${job._id}`
              );
              alert("Job link copied!");
            }}
            className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded shadow-sm hover:bg-gray-200 transition"
          >
            Copy Link to Social Media
          </button>
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
    skills: [],
    postedAt: null,
    noticeperiod: "",
    _id: "",
  },
};

export default JobCard;