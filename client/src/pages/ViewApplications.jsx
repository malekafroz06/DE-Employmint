import React, { useContext, useEffect, useState, useRef } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import Loading from "../components/Loading";
import CandidateDetails from "./CandidateDetails";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, FileText, Mail, Phone, UserCircle, Globe, TrendingUp, Tag, Building2, ChevronDown, Languages, Heart, Calendar, Clock, DollarSign, User, MapPin, Briefcase, MoreHorizontal, Search, Eye, ClipboardList, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";

const ViewApplications = () => {
  const { backendUrl, companyToken, companyData } = useContext(AppContext);
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeApplicantName, setResumeApplicantName] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectApplicationId, setRejectApplicationId] = useState(null);
  const [rejectCandidateName, setRejectCandidateName] = useState("");
  const [acceptApplicationId, setAcceptApplicationId] = useState(null);
  const dropdownRef = useRef(null);

  // ✅ Check if user is sub-user (HR/Consultancy/Management)
  const isSubUser = companyData?.isSubUser || false;
  const subUserRole = companyData?.roleType || '';

  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <div className="text-center">
          <p className="text-xl sm:text-2xl text-gray-600 mb-4">Please login as a company first</p>
        </div>
      </div>
    );
  }

  const fetchCompanyJobApplications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/company/applicants`, {
        headers: { token: companyToken },
      });

      if (data.success) {
        console.log("Fetched applications:", data.applications);
        const pending = data.applications
          .reverse()
          .filter(a => {
            const s = (a.status || "").toLowerCase();
            return s !== "accepted" && s !== "rejected";
          });
        setApplicants(pending);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

 const changeJobApplicationStatus = async (id, status, remarks = "") => {
  // ✅ Prevent sub-users from accepting/rejecting
  if (isSubUser) {
    toast.error(`${subUserRole.toUpperCase()} users cannot accept/reject applications. Only view and assess.`);
    return;
  }

  try {
    console.log("Changing status for application:", id, "to:", status);

    const { data } = await axios.post(
      `${backendUrl}/api/company/change-status`,
      { id, status, remarks },
      { headers: { token: companyToken } }
    );

    if (data.success) {
      // Remove from UI list (status is persisted in DB)
      setApplicants(prev => prev.filter(a => a._id !== id));
      toast.success(`Application ${status.toLowerCase()} successfully`);
      setActiveDropdown(null);

      // ✅ Broadcast to SearchResume page so it reflects accepted/rejected instantly
        try {
        const bc = new BroadcastChannel("application_updates");
        bc.postMessage({
          type: status.toLowerCase() === "rejected"
            ? "APPLICATION_REJECTED"
            : "APPLICATION_ACCEPTED",
          applicationId: id,
          candidateEmail: applicants.find(a => a._id === id)?.userId?.email || "", // ← ADD THIS
        });
        bc.close();
      } catch {
        // BroadcastChannel not supported in this environment — silently skip
      }

    } else {
      console.error("Status change failed:", data.message);
      toast.error(data.message);
    }
  } catch (error) {
    console.error("Error changing status:", error);
    toast.error(error.response?.data?.message || error.message);
  }
};

  // Open assessment in new tab
  const handleOpenAssessmentTab = (applicant) => {
    const email  = applicant.userId?.email || "";
    const name   = applicant.userId?.name  || "";
    const phone  = applicant.userId?.phone || "";
    const appId  = applicant._id || "";
    const url    = `/assessment?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&applicationId=${encodeURIComponent(appId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setActiveDropdown(null);
  };

  // Listen for BroadcastChannel messages from assessment tab
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel("application_updates");
      bc.onmessage = (event) => {
        if (event.data?.type === "APPLICATION_ACCEPTED" && event.data?.applicationId) {
          setApplicants(prev => prev.filter(a => a._id !== event.data.applicationId));
          toast.success("Application accepted via assessment.");
        }
      if (event.data?.type === "APPLICATION_REJECTED" && event.data?.applicationId) {
        setCombinedData(prev =>
          prev.map(c =>
            c._id === event.data.applicationId
              ? { ...c, rejected: true }
              : c
          )
        );
        toast.info("Candidate rejected.");
      }
    };
  } catch { /* BroadcastChannel not supported */ }
  return () => { try { bc?.close(); } catch { } };
}, []);
  const handleViewResume = (resumeUrl, applicantName) => {
    if (!resumeUrl || 
        resumeUrl.trim() === '' || 
        resumeUrl === 'undefined' || 
        resumeUrl === 'null' ||
        resumeUrl === '/undefined' ||
        resumeUrl.endsWith('/null') ||
        resumeUrl.endsWith('/undefined')) {
      setResumeApplicantName(applicantName || 'Unknown');
      setResumeModalOpen(true);
      return;
    }

    let fullUrl = resumeUrl;
    if (!resumeUrl.startsWith('http')) {
      const cleanUrl = resumeUrl.startsWith('/') ? resumeUrl.substring(1) : resumeUrl;
      fullUrl = `${backendUrl}/${cleanUrl}`;
    }

    console.log("Opening resume URL:", fullUrl);

    fetch(fullUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          window.open(fullUrl, '_blank', 'noopener,noreferrer');
        } else {
          console.error('Resume file not found on server');
          setResumeApplicantName(applicantName || 'Unknown');
          setResumeModalOpen(true);
        }
      })
      .catch(error => {
        console.error('Error checking resume:', error);
        setResumeApplicantName(applicantName || 'Unknown');
        setResumeModalOpen(true);
      });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultAvatar;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return `${backendUrl}${imagePath}`;
    } else {
      return `${backendUrl}/${imagePath}`;
    }
  };

  const handleViewProfile = (userId, userData) => {
    console.log("Viewing profile for user:", userId, userData);
    
    if (!userId) {
      toast.error("User profile not available");
      return;
    }
    
    setSelectedProfile(userData);
    setProfileModalOpen(true);
  };

  const handleViewAssessment = (userId, userData) => {
    console.log("Viewing assessment for user:", userId, userData);
    
    if (!userId) {
      toast.error("User data not available");
      return;
    }
    
    setSelectedProfile(userData);
    setAssessmentModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobApplications();
    }
  }, [companyToken]);

  const filteredApplicants = applicants
    .filter(item => item.jobId && item.userId)
    .filter(applicant => {
      const matchesSearch = searchTerm === "" || 
        (applicant.userId?.name && applicant.userId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (applicant.jobId?.title && applicant.jobId.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (applicant.jobId?.location && applicant.jobId.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "pending" && (!applicant.status || applicant.status.toLowerCase() === "pending")) ||
        (filterStatus === "accepted" && applicant.status && applicant.status.toLowerCase() === "accepted") ||
        (filterStatus === "rejected" && applicant.status && applicant.status.toLowerCase() === "rejected");
      
      return matchesSearch && matchesStatus;
    });

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase() || "pending";
    
    switch(normalizedStatus) {
      case "accepted":
        return (
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-full text-sm font-medium">
            <Check size={14} />
            <span>Accepted</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-full text-sm font-medium">
            <X size={14} />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div 
            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: '#FFF0F0', color: '#FF0000' }}
          >
            <ChevronDown size={14} />
            <span>Pending</span>
          </div>
        );
    }
  };

  if (loading) {
    return <Loading />;
  }
  return (
    <div className="bg-white min-h-screen py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-2"
                style={{ color: '#020330' }}
              >
                Application Management
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                {isSubUser 
                  ? `View and assess candidate applications as ${subUserRole.toUpperCase()}`
                  : 'Review and manage candidate applications'
                }
              </p>
            </div>
            
            {/* ✅ Show role badge for sub-users */}
            {isSubUser && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
                <Shield size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="font-semibold uppercase">{subUserRole}</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
        >
          {/* ✅ RESPONSIVE Filters and Search */}
          <div className="p-4 sm:p-5 border-b border-gray-100">
            {/* Search Bar - Full Width on Mobile */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applicants..."
                className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-200 focus:ring-2 focus:border-red-300 transition-colors text-sm sm:text-base"
                style={{ '--tw-ring-color': 'rgba(255, 0, 0, 0.1)' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <style jsx>{`
                input:focus {
                  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1) !important;
                }
              `}</style>
            </div>
            
            {/* ✅ RESPONSIVE Filter Buttons */}
           {/* Filter Buttons */}
<div className="flex flex-wrap gap-2">
  <button
    onClick={() => setFilterStatus("all")}
    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
      filterStatus === "all"
        ? "text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
    style={filterStatus === "all" ? { backgroundColor: '#FF0000' } : {}}
  >
    All ({applicants.length})
  </button>

  <button
    onClick={() => setFilterStatus("pending")}
    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
      filterStatus === "pending"
        ? "text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
    style={filterStatus === "pending" ? { backgroundColor: '#FF0000' } : {}}
  >
    Pending ({applicants.length})
  </button>
</div>
          </div>

          {/* ✅ RESPONSIVE Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead className="bg-gray-50" style={{ color: '#020330' }}>
                <tr>
                  <th className="py-3 sm:py-4 px-3 sm:px-5 text-left text-xs sm:text-sm font-semibold">#</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-5 text-left text-xs sm:text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <User size={14} className="sm:w-4 sm:h-4" />
                      <span>Applicant</span>
                    </div>
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-5 text-left text-xs sm:text-sm font-semibold max-md:hidden">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="sm:w-4 sm:h-4" />
                      <span>Job Position</span>
                    </div>
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-5 text-left text-xs sm:text-sm font-semibold max-lg:hidden">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="sm:w-4 sm:h-4" />
                      <span>Location</span>
                    </div>
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-5 text-left text-xs sm:text-sm font-semibold">Actions</th>
                  {!isSubUser && <th className="py-3 sm:py-4 px-3 sm:px-5 text-left text-xs sm:text-sm font-semibold">Status</th>}
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={isSubUser ? "5" : "6"}>
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                        <img 
                          src={assets.default_company_icon || "/empty-state.svg"} 
                          alt="No applications" 
                          className="w-16 h-16 sm:w-20 sm:h-20 mb-4 opacity-30"
                        />
                        <h3 
                          className="text-base sm:text-lg font-medium mb-1"
                          style={{ color: '#020330' }}
                        >
                          No applications found
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 text-center mb-2">No matching applications with the current filters</p>
                        {(searchTerm || filterStatus !== "all") && (
                          <button 
                            onClick={() => {
                              setSearchTerm("");
                              setFilterStatus("all");
                            }}
                            className="mt-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-white hover:opacity-90"
                            style={{ backgroundColor: '#FF0000' }}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant, index) => (
                    <motion.tr 
                      key={applicant._id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-red-50/30 transition-colors"
                    >
                      <td className="py-3 sm:py-4 px-3 sm:px-5 text-xs sm:text-sm text-gray-600">{index + 1}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-5">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 cursor-pointer hover:border-red-300 transition-colors flex-shrink-0"
                            onClick={() => handleViewProfile(applicant.userId?._id, applicant.userId)}
                            title="View profile"
                          >
                            <img
                              className="w-full h-full object-cover"
                              src={getImageUrl(applicant.userId?.image)}
                              alt={`${applicant.userId?.name || 'Applicant'}'s avatar`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultAvatar;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                              {applicant.userId?.name || 'Unknown'}
                            </div>
                            <div className="text-gray-500 text-xs sm:text-sm truncate">
                              {applicant.userId?.email || 'No email'}
                            </div>
                            <div className="text-gray-500 text-xs md:hidden truncate">
                              {applicant.jobId?.title || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-5 text-xs sm:text-sm text-gray-700 max-md:hidden">
                        {applicant.jobId?.title || 'N/A'}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-5 text-xs sm:text-sm text-gray-700 max-lg:hidden">
                        {applicant.jobId?.location || 'Remote'}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-5">
                        <div className="flex flex-col sm:flex-row flex-wrap gap-1.5 sm:gap-2">
                          <button
                            onClick={() => handleViewResume(applicant.userId?.resume, applicant.userId?.name)}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-white hover:opacity-90 whitespace-nowrap"
                            style={{ backgroundColor: '#FF0000' }}
                          >
                            <FileText size={12} className="sm:w-[14px] sm:h-[14px]" />
                            <span>Resume</span>
                          </button>
                          <button
                            onClick={() => handleViewProfile(applicant.userId?._id, applicant.userId)}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-50 text-blue-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                          >
                            <Eye size={12} className="sm:w-[14px] sm:h-[14px]" />
                            <span>Profile</span>
                          </button>
                        </div>
                      </td>
                      
                      {/* ✅ Only show status column for main recruiters */}
                    {!isSubUser && (
                      <td className="py-3 sm:py-4 px-3 sm:px-5">
                        {(!applicant.status || applicant.status.toLowerCase() === "pending") ? (
                          <div className="flex items-center gap-1 sm:gap-2">
                            {/* Accept → opens assessment tab */}
                            <button
                              onClick={() => handleOpenAssessmentTab(applicant)}
                              className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Accept (Open Assessment)"
                            >
                              <Check size={16} />
                            </button>

                            {/* Reject → opens remarks modal */}
                            <button
                              onClick={() => {
                                setRejectApplicationId(applicant._id);
                                setRejectCandidateName(applicant.userId?.name || "Candidate");
                                setRejectModalOpen(true);
                              }}
                              className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          getStatusBadge(applicant.status)
                        )}
                      </td>
                    )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        
              {/* Profile Modal */}
              <CandidateProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={selectedProfile}
                backendUrl={backendUrl}
              />

            {/* Reject Remarks Modal */}
            <RejectRemarksModal
              isOpen={rejectModalOpen}
              onClose={() => { setRejectModalOpen(false); setRejectApplicationId(null); }}
              candidateName={rejectCandidateName}
              onConfirm={(remarks) => {
                changeJobApplicationStatus(rejectApplicationId, "Rejected", remarks);
                setRejectModalOpen(false);
                setRejectApplicationId(null);
              }}
            />

        {/* Resume Not Available Modal */}
        <AnimatePresence>
          {resumeModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-5 z-50"
              onClick={() => setResumeModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6 sm:p-10 text-center max-w-md w-full relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setResumeModalOpen(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
                
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                  <FileText size={24} className="sm:w-8 sm:h-8 text-red-500" />
                </div>
                
                <h1 className="text-lg sm:text-xl font-semibold mb-3" style={{ color: '#020330' }}>
                  Resume Not Available
                </h1>
                
                <p className="text-sm sm:text-base text-gray-600 mb-2">
                  The candidate <span className="text-red-500 font-semibold">{resumeApplicantName}</span> has not uploaded their resume yet.
                </p>
                
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  Please contact them directly to request their resume.
                </p>
                
                <button
                  onClick={() => setResumeModalOpen(false)}
                  className="bg-red-500 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Reject Remarks Modal Component
const RejectRemarksModal = ({ isOpen, onClose, candidateName, onConfirm }) => {
  const [remarks, setRemarks] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(remarks.trim());
    setRemarks("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Reject Application</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            You are rejecting the application of{" "}
            <span className="font-semibold text-red-600">{candidateName}</span>.
            Please add your remarks below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Rejection Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                placeholder="Enter reason for rejection or any remarks..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X size={15} />
                Confirm Reject
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Candidate Profile Modal Component
const CandidateProfileModal = ({ isOpen, onClose, profile, backendUrl }) => {
  if (!isOpen || !profile) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const displayValue = (value, fallback = 'Not Provided') => {
    if (!value || value.toString().trim() === '') {
      return <span className="text-gray-400 italic">{fallback}</span>;
    }
    return value;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === '/default-avatar.png' || imagePath === 'default-avatar.png') {
      return null;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return imagePath.startsWith('/') 
      ? `${backendUrl}${imagePath}` 
      : `${backendUrl}/${imagePath}`;
  };

  const fullName = `${profile.firstName || ''} ${profile.middleName || ''} ${profile.surname || ''}`.trim() || profile.name || 'Unknown';
  const imageUrl = getImageUrl(profile.image);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#020330' }}>
              Candidate Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-gray-200">
              <div className="relative flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={fullName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const initialsDiv = e.target.nextElementSibling;
                      if (initialsDiv) {
                        initialsDiv.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-4 border-gray-100"
                  style={{ 
                    background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
                    display: imageUrl ? 'none' : 'flex'
                  }}
                >
                  {getInitials(fullName)}
                </div>
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {displayValue(fullName, 'Name Not Provided')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <Briefcase size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{displayValue(profile.currentDesignation, 'No designation provided')}</span>
                </p>
                {profile.currentDepartment && (
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <Building2 size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                    <span className="truncate">{profile.currentDepartment}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#020330' }}>
                <UserCircle size={18} className="sm:w-5 sm:h-5" />
                Personal Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <User size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">First Name</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">{displayValue(profile.firstName)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Middle Name</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">{displayValue(profile.middleName)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Surname</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">{displayValue(profile.surname)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Email</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate break-all">{displayValue(profile.emailId || profile.email)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Phone size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Mobile Number</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.mobileNo)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">City</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">{displayValue(profile.city)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">State</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">{displayValue(profile.state)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Languages size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Languages</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.languages)}</p>
                  </div>
                </div>
              
                <div className="flex items-start gap-2">
                  <Heart size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Marital Status</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.maritalStatus)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#020330' }}>
                <Briefcase size={18} className="sm:w-5 sm:h-5" />
                Professional Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Briefcase size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Current Designation</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">{displayValue(profile.currentDesignation)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Building2 size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Current Department</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">{displayValue(profile.currentDepartment)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Total Experience</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.totalExperience)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <DollarSign size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Current CTC</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.currentCTC)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <DollarSign size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Expected CTC</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.expectedCTC)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Notice Period</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.noticePeriod)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Briefcase size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Role Type</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.roleType)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <TrendingUp size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Job Change Status</p>
                    <p className="text-sm sm:text-base text-gray-900">{displayValue(profile.jobChangeStatus)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Building2 size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Sector</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">
                      {profile.sector === 'Other' 
                        ? displayValue(profile.otherSector, 'Other (Not Specified)')
                        : displayValue(profile.sector)
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Tag size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Category</p>
                    <p className="text-sm sm:text-base text-gray-900 truncate">
                      {profile.category === 'Other' 
                        ? displayValue(profile.otherCategory, 'Other (Not Specified)')
                        : displayValue(profile.category)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#020330' }}>
                <Globe size={18} className="sm:w-5 sm:h-5" />
                Social Profiles
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Globe size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">LinkedIn</p>
                    {profile.linkedinId ? (
                      <a
                        href={profile.linkedinId}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs sm:text-sm truncate block"
                      >
                        View Profile →
                      </a>
                    ) : (
                      <p className="text-gray-400 italic text-xs sm:text-sm">Not Provided</p>
                    )}
                  </div>
                </div>
     
                <div className="flex items-start gap-2">
                  <Globe size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Instagram</p>
                    {profile.instagramId ? (
                      <a
                        href={profile.instagramId}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline text-xs sm:text-sm truncate block"
                      >
                      View Profile → 
                      </a>
                    ) : (
                      <p className="text-gray-400 italic text-xs sm:text-sm">Not Provided</p>
                    )}        
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">Facebook</p>
                    {profile.facebookId ? (
                      <a  
                        href={profile.facebookId}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline text-xs sm:text-sm truncate block"
                      >
                        View Profile →
                      </a>
                    ) : (
                      <p className="text-gray-400 italic text-xs sm:text-sm">Not Provided</p>
                 
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
export default ViewApplications;
