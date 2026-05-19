import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiSearch,
  FiDownload,
  FiEye,
  FiTrash2,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCalendar,
  FiBriefcase,
  FiTrendingUp,
  FiCheckCircle,
  FiCheck,
  FiShield,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";

const ROLE_COLORS = {
  consultancy: "bg-blue-50 border-blue-200 text-blue-700",
  hr:          "bg-purple-50 border-purple-200 text-purple-700",
  management:  "bg-green-50 border-green-200 text-green-700",
  recruiter:   "bg-gray-50 border-gray-200 text-gray-700",
};

const ROLE_LABELS = {
  consultancy: "Consultancy",
  hr:          "HR",
  management:  "Management",
  recruiter:   "Recruiter",
};

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

const SearchResume = () => {
  const { companyToken, backendUrl } = useContext(AppContext);
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification } = outletContext || {};

  const [combinedData, setCombinedData]           = useState([]);
  const [filteredData, setFilteredData]           = useState([]);
  const [isLoading, setIsLoading]                 = useState(false);
  const [searchQuery, setSearchQuery]             = useState("");
  const [filterStatus, setFilterStatus]           = useState("all");
  const [sortBy, setSortBy]                       = useState("name");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectAll, setSelectAll]                 = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal]     = useState(false);

  // Assessment modal states
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [viewingAssessment, setViewingAssessment]     = useState(null);

  const [matchingStats, setMatchingStats] = useState({
    total: 0, matched: 0, unmatched: 0, matchRate: 0
  });

  useEffect(() => {
    if (companyToken) fetchCombinedData();
  }, [companyToken]);

  useEffect(() => {
    filterAndSortData();
  }, [combinedData, searchQuery, filterStatus, sortBy]);

  // Listen for assessment tab completion → mark candidate as accepted in UI immediately
 useEffect(() => {
  let bc;
  try {
    bc = new BroadcastChannel("application_updates");
    bc.onmessage = (event) => {

      if (event.data?.type === "APPLICATION_ACCEPTED") {
        const { applicationId, candidateEmail } = event.data;

        setCombinedData(prev =>
          prev.map(c => {
            // Match by bulk-upload _id (SearchResume candidates)
            if (applicationId && c._id === applicationId) {
              return { ...c, accepted: true };
            }
            // Match by email (when coming from ViewApplications assessment tab)
            if (candidateEmail && c.email?.toLowerCase() === candidateEmail.toLowerCase()) {
              return { ...c, accepted: true };
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
              return { ...c, rejected: true };
            }
            if (candidateEmail && c.email?.toLowerCase() === candidateEmail.toLowerCase()) {
              return { ...c, rejected: true };
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

  const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");
  };

  const namesMatch = (name1, name2) => {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) {
      if (Math.abs(n1.length - n2.length) <= 3) return true;
    }
    const w1 = name1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const w2 = name2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (w1.length > 0 && w2.length > 0) {
      const f1 = normalizeName(w1[0]);
      const f2 = normalizeName(w2[0]);
      if (f1 === f2) return true;
      if (f1.length >= 4 && f2.length >= 4) {
        if (f1.startsWith(f2) || f2.startsWith(f1)) return true;
      }
    }
    return false;
  };

  const getCsvDataByName = (candidateName, csvFile) => {
    if (!csvFile?.data || !Array.isArray(csvFile.data)) return null;
    return csvFile.data.find((row, index) => {
      if (!row || row.length < 1) return false;
      if (index === 0 && row[0]?.toLowerCase().includes('full')) return false;
      return namesMatch(candidateName, row[0] || '');
    }) || null;
  };

  const parseCsvRow = (row) => {
    if (!row) return {};
    const headers = [
      'Full Name','Gender','DOB','Mobile No',
      'Email ID','Linkedin ID','Facebook ID','Instagram ID','Snapchat',
      'City','State','Languages','Marital Status',
      'Sector','Category','Product','Channel',
      'Current Designation','Current Department','Current CTC','Expected CTC',
      'Notice Period','Total Experience','Status for Job Change'
    ];
    const data = {};
    row.forEach((value, i) => {
      if (i < headers.length) data[headers[i]] = value || "N/A";
    });
    return data;
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────────

  const fetchCombinedData = async () => {
    setIsLoading(true);
    try {
      const [resumesRes, csvRes] = await Promise.all([
        axios.get(`${backendUrl}/api/bulk-upload/files?type=resumes&limit=1000`, {
          headers: { token: companyToken }
        }),
        axios.get(`${backendUrl}/api/bulk-upload/files?type=csv&limit=1000`, {
          headers: { token: companyToken }
        })
      ]);

      if (resumesRes.data.success && csvRes.data.success) {
        const resumes  = resumesRes.data.data?.files || resumesRes.data.files || [];
        const csvFiles = csvRes.data.data?.files    || csvRes.data.files    || [];

        const parsedCsvFiles = await Promise.all(
          csvFiles.map(async (csvFile) => {
            if (csvFile.data && Array.isArray(csvFile.data) && csvFile.data.length > 0) return csvFile;
            try {
              const response = await axios.get(
                `${backendUrl}/api/bulk-upload/download/${csvFile._id}`,
                { headers: { token: companyToken }, responseType: 'blob' }
              );
              const fileName = csvFile.originalName.toLowerCase();

              if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const arrayBuffer = await response.data.arrayBuffer();
                const workbook    = XLSX.read(arrayBuffer, { type: 'array' });
                const ws          = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData    = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                return { ...csvFile, data: jsonData.filter(row => row.some(cell => cell !== '')) };
              } else if (fileName.endsWith('.csv')) {
                const text      = await response.data.text();
                const firstLine = text.split('\n')[0];
                const delimiter = firstLine.includes('\t') ? '\t' : ',';
                const rows = text.split('\n').map(row => {
                  if (delimiter === '\t') return row.split('\t').map(c => c.trim());
                  const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;
                  return row.match(regex)?.map(c => c.replace(/^"|"$/g, '').trim()) || [];
                }).filter(row => row.length > 1 && row.some(c => c !== ''));
                return { ...csvFile, data: rows };
              }
              return csvFile;
            } catch (error) {
              console.error('Error fetching/parsing CSV:', csvFile.originalName, error);
              return csvFile;
            }
          })
        );

        const combined = resumes.map(resume => {
          const resumeFileName = resume.originalName || "";
          const extractedName  = extractCandidateName(resumeFileName);
          const candidateName  = resume.parsedData?.name || extractedName;

          let csvMatch = null, csvMatchedData = null;
          for (const csvFile of parsedCsvFiles) {
            csvMatchedData = getCsvDataByName(candidateName, csvFile);
            if (csvMatchedData) { csvMatch = csvFile; break; }
          }

          const parsedCsv = csvMatchedData ? parseCsvRow(csvMatchedData) : null;

          return {
            _id:            resume._id,
            rejected:       resume.rejected       || false,
            accepted:       resume.accepted       || false,
            assessmentData: resume.assessmentData || {},
            resumeName:     resumeFileName,
            candidateName,
            email:    parsedCsv?.['Email ID']  || resume.parsedData?.email    || "N/A",
            phone:    parsedCsv?.['Mobile No'] || resume.parsedData?.phone    || "N/A",
            location: `${parsedCsv?.['City'] || ''} ${parsedCsv?.['State'] || ''}`.trim() || resume.parsedData?.location || "N/A",
            skills:   parsedCsv?.['Languages']      || resume.parsedData?.skills    || "N/A",
            experience: parsedCsv?.['Total Experience'] || resume.parsedData?.experience || "N/A",
            status:     resume.status,
            fileSize:   resume.fileSize,
            uploadDate: resume.uploadDate || resume.createdAt,
            resumeFile: resume,
            csvData:    parsedCsv,
            csvMatched: !!csvMatchedData,
            csvFileName: csvMatch?.originalName || "N/A",
            fullName:      parsedCsv?.['Full Name']    || candidateName,
            gender:        parsedCsv?.['Gender']        || "N/A",
            dob:           parsedCsv?.['DOB']           || "N/A",
            city:          parsedCsv?.['City']          || "N/A",
            state:         parsedCsv?.['State']         || "N/A",
            languages:     parsedCsv?.['Languages']     || "N/A",
            maritalStatus: parsedCsv?.['Marital Status']|| "N/A",
            linkedinId:    parsedCsv?.['Linkedin ID']   || "N/A",
            facebookId:    parsedCsv?.['Facebook ID']   || "N/A",
            instagramId:   parsedCsv?.['Instagram ID']  || "N/A",
            snapchat:      parsedCsv?.['Snapchat']      || "N/A",
            sector:             parsedCsv?.['Sector']             || "N/A",
            category:           parsedCsv?.['Category']           || "N/A",
            product:            parsedCsv?.['Product']            || "N/A",
            channel:            parsedCsv?.['Channel']            || "N/A",
            currentDesignation: parsedCsv?.['Current Designation']|| "N/A",
            currentDepartment:  parsedCsv?.['Current Department'] || "N/A",
            currentCTC:    parsedCsv?.['Current CTC']          || "N/A",
            expectedCTC:   parsedCsv?.['Expected CTC']         || "N/A",
            noticePeriod:  parsedCsv?.['Notice Period']        || "N/A",
            totalExperience: parsedCsv?.['Total Experience']   || "N/A",
            jobChangeStatus: parsedCsv?.['Status for Job Change'] || "N/A",
          };
        });

        const totalResumes   = combined.length;
        const matchedResumes = combined.filter(c => c.csvMatched).length;
        setMatchingStats({
          total:     totalResumes,
          matched:   matchedResumes,
          unmatched: totalResumes - matchedResumes,
          matchRate: totalResumes > 0 ? Math.round((matchedResumes / totalResumes) * 100) : 0
        });

        setCombinedData(combined);
        toast.success(`Loaded ${totalResumes} resumes. ${matchedResumes} matched with CSV data.`);
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
        item.candidateName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        String(item.phone || '').includes(q) ||
        item.sector.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.currentDesignation.toLowerCase().includes(q) ||
        item.currentDepartment.toLowerCase().includes(q) ||
        item.currentCTC.toLowerCase().includes(q) ||
        item.languages.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "matched"   && item.csvMatched) ||
        (filterStatus === "unmatched" && !item.csvMatched);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortBy === "name")    return a.candidateName.localeCompare(b.candidateName);
      if (sortBy === "date")    return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortBy === "matched") return (b.csvMatched ? 1 : 0) - (a.csvMatched ? 1 : 0);
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
        ['Expected CTC', candidate.expectedCTC],
        ['Total Experience', candidate.totalExperience],
        ['Notice Period', candidate.noticePeriod],
        ['Job Change Status', candidate.jobChangeStatus],
        [''],
        ['Social Media',''],
        ['LinkedIn', candidate.linkedinId],
        ['Facebook', candidate.facebookId],
        ['Instagram', candidate.instagramId],
        ['Snapchat', candidate.snapchat],
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
      setSelectedCandidates(filteredData.filter(c => !c.rejected && !c.accepted).map(c => c._id));
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
        'Current Designation','Current Department','Current CTC','Expected CTC',
        'Total Experience','Notice Period','Job Change Status','LinkedIn',
        'Facebook','Instagram','Snapchat'
      ]];
      selectedData.forEach((c, i) => {
        excelData.push([
          i + 1, c.fullName, c.gender, c.dob, c.email, c.phone, c.city, c.state,
          c.maritalStatus, c.languages, c.sector, c.category, c.product, c.channel,
          c.currentDesignation, c.currentDepartment, c.currentCTC, c.expectedCTC,
          c.totalExperience, c.noticePeriod, c.jobChangeStatus,
          c.linkedinId, c.facebookId, c.instagramId, c.snapchat
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
                View combined resume and candidate details from CSV uploads
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
                placeholder="Search by name, city, designation, department, CTC, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {[
              { key: "all",       label: `All (${combinedData.length})`,                              active: "bg-red-500",    inactive: "" },
              { key: "matched",   label: `Matched (${combinedData.filter(d => d.csvMatched).length})`, active: "bg-green-500",  inactive: "" },
              { key: "unmatched", label: `Unmatched (${combinedData.filter(d => !d.csvMatched).length})`, active: "bg-orange-500", inactive: "" },
            ].map(btn => (
              <button
                key={btn.key}
                onClick={() => setFilterStatus(btn.key)}
                className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  filterStatus === btn.key
                    ? `${btn.active} text-white shadow-md`
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

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
            <p className="text-gray-600 text-sm sm:text-base">Loading and matching resumes with CSV data...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#020330' }}>
                Results ({filteredData.length})
              </h3>
            </div>

            <div className="block lg:hidden p-3 bg-blue-50 border-b border-blue-200">
              <p className="text-xs text-blue-800 text-center">💡 Swipe left to see all columns →</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 text-center text-xs sm:text-sm font-medium text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-700 w-16">Sr. No.</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">Designation</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">Department</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">Category</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">Product</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">Experience</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">CTC</th>
                    <th className="py-3 px-3 sm:px-6 text-left text-xs sm:text-sm font-medium text-gray-700">Location</th>
                    <th className="py-3 px-3 sm:px-6 text-center text-xs sm:text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((candidate, index) => (
                    <motion.tr
                      key={candidate._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate._id)}
                          onChange={() => handleSelectCandidate(candidate._id)}
                          disabled={candidate.rejected || candidate.accepted}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Sr. No. */}
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-sm font-medium text-gray-700">
                        {index + 1}
                      </td>

                      {/* Name */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0"
                            style={{ backgroundColor: candidate.csvMatched ? '#00C851' : '#FF6666' }}
                          >
                            {candidate.candidateName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                              {candidate.candidateName}
                            </p>
                            <p className="text-xs text-gray-500 truncate hidden sm:block">
                              {candidate.resumeName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm text-gray-600">
                        <span className="truncate block">{candidate.currentDesignation || '—'}</span>
                      </td>

                      {/* Department */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm text-gray-600">
                        <span className="truncate block">{candidate.currentDepartment || '—'}</span>
                      </td>

                      {/* Category */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm text-gray-600">
                        <span className="truncate block">{candidate.category || '—'}</span>
                      </td>

                      {/* Product */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm text-gray-600">
                        <span className="truncate block">{candidate.product || '—'}</span>
                      </td>

                      {/* Experience */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm text-gray-600">
                        <span className="truncate block">{candidate.totalExperience || '—'}</span>
                      </td>

                      {/* CTC */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm text-gray-600">
                        <span className="truncate block">{candidate.currentCTC || '—'}</span>
                      </td>

                      {/* Location */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm text-gray-600">
                        <span className="truncate block">{candidate.city || '—'}</span>
                      </td>

                      {/* ── ACTION ── */}
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        {candidate.rejected ? (
                          /* ── REJECTED ── */
                          <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                            Rejected
                          </span>
                        ) : candidate.accepted ? (
                          /* ── ACCEPTED ── */
                          <div className="flex justify-center items-center gap-2">
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                              Accepted
                            </span>
                            <button
                              onClick={() => {
                                setViewingAssessment(candidate);
                                setShowAssessmentModal(true);
                              }}
                              className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Assessment"
                            >
                              <FiEye size={16} />
                            </button>
                          </div>
                        ) : (
                          /* ── PENDING ── */
                          <div className="flex justify-center items-center flex-wrap gap-1 sm:gap-2">
                            {/* Download CV */}
                            <button
                              onClick={() => downloadResume(candidate.resumeFile)}
                              className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download CV"
                            >
                              <FiDownload size={16} />
                            </button>

                            {/* Open Assessment */}
                            <button
                              onClick={() => {
                                const url = `/assessment?email=${encodeURIComponent(candidate.email || '')}&name=${encodeURIComponent(candidate.candidateName || '')}&phone=${encodeURIComponent(candidate.phone || '')}&applicationId=${encodeURIComponent(candidate._id || '')}`;
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Accept (Open Assessment)"
                            >
                              <FiCheck size={16} />
                            </button>

                            {/* Reject */}
                            <button
                              onClick={async () => {
                                try {
                                  await axios.post(
                                    `${backendUrl}/api/bulk-upload/reject/${candidate._id}`,
                                    {},
                                    { headers: { token: companyToken } }
                                  );
                                  setCombinedData(prev =>
                                    prev.map(c => c._id === candidate._id ? { ...c, rejected: true } : c)
                                  );
                                  setSelectedCandidates(prev => prev.filter(id => id !== candidate._id));
                                  toast.info(`${candidate.candidateName} rejected`);
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
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-8 text-center">
            <FiFileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2 text-sm sm:text-base">No resumes found</p>
            <p className="text-xs sm:text-sm text-gray-500">Upload resumes and CSV files to see combined data here</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          DETAIL MODAL (existing)
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDetailModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full sm:rounded-xl shadow-2xl sm:max-w-4xl sm:my-8 max-h-screen sm:max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0"
                    style={{ backgroundColor: selectedCandidate.csvMatched ? '#00C851' : '#FF6666' }}
                  >
                    {selectedCandidate.candidateName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold truncate" style={{ color: '#020330' }}>
                      {selectedCandidate.candidateName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedCandidate.resumeName}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2">
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 sm:p-6">
                {/* Contact */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>📋 Contact Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { label: "Full Name",     value: selectedCandidate.fullName },
                      { label: "Gender",        value: selectedCandidate.gender },
                      { label: "Date of Birth", value: selectedCandidate.dob },
                    ].map(f => (
                      <div key={f.label} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <label className="text-xs sm:text-sm text-gray-600 block mb-1">{f.label}</label>
                        <p className="text-sm text-gray-900 font-medium">{f.value}</p>
                      </div>
                    ))}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Email</label>
                      <div className="flex items-center gap-2 text-gray-900 text-sm">
                        <FiMail size={14} className="text-red-500 flex-shrink-0" />
                        <a href={`mailto:${selectedCandidate.email}`} className="hover:text-red-500 break-all">{selectedCandidate.email}</a>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Phone</label>
                      <div className="flex items-center gap-2 text-gray-900 text-sm">
                        <FiPhone size={14} className="text-red-500 flex-shrink-0" />
                        <a href={`tel:${selectedCandidate.phone}`} className="hover:text-red-500">{selectedCandidate.phone}</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>💼 Professional Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { label: "Sector",             value: selectedCandidate.sector },
                      { label: "Category",           value: selectedCandidate.category },
                      { label: "Product",            value: selectedCandidate.product },
                      { label: "Channel",            value: selectedCandidate.channel },
                      { label: "Current Designation",value: selectedCandidate.currentDesignation },
                      { label: "Current Department", value: selectedCandidate.currentDepartment },
                    ].map(f => (
                      <div key={f.label} className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                        <label className="text-xs sm:text-sm text-gray-600 block mb-1">{f.label}</label>
                        <p className="text-sm text-gray-900 font-medium">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>👤 Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      { label: "City",           value: selectedCandidate.city },
                      { label: "State",          value: selectedCandidate.state },
                      { label: "Marital Status", value: selectedCandidate.maritalStatus },
                    ].map(f => (
                      <div key={f.label} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <label className="text-xs sm:text-sm text-gray-600 block mb-1">{f.label}</label>
                        <p className="text-sm text-gray-900 font-medium">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compensation */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>💰 Compensation & Experience</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { label: "Current CTC",    value: selectedCandidate.currentCTC },
                      { label: "Expected CTC",   value: selectedCandidate.expectedCTC },
                      { label: "Total Experience",value: selectedCandidate.totalExperience },
                      { label: "Notice Period",   value: selectedCandidate.noticePeriod },
                    ].map(f => (
                      <div key={f.label} className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                        <label className="text-xs sm:text-sm text-gray-600 block mb-1">{f.label}</label>
                        <p className="text-sm text-gray-900 font-medium">{f.value}</p>
                      </div>
                    ))}
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500 sm:col-span-2">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Job Change Status</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.jobChangeStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>🔗 Social Media Links</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">LinkedIn ID</label>
                      <a
                        href={selectedCandidate.linkedinId !== "N/A" ? `https://linkedin.com/in/${selectedCandidate.linkedinId}` : "#"}
                        target="_blank" rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {selectedCandidate.linkedinId}
                      </a>
                    </div>
                    {[
                      { label: "Facebook ID",  value: selectedCandidate.facebookId },
                      { label: "Instagram ID", value: selectedCandidate.instagramId },
                      { label: "Snapchat",     value: selectedCandidate.snapchat },
                    ].map(f => (
                      <div key={f.label} className="bg-purple-50 p-3 sm:p-4 rounded-lg border-l-4 border-purple-500">
                        <label className="text-xs sm:text-sm text-gray-600 block mb-1">{f.label}</label>
                        <p className="text-sm text-gray-900 font-medium break-all">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>🗣️ Languages</h4>
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-900">{selectedCandidate.languages}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <button onClick={() => downloadCandidateInfo(selectedCandidate)} className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                  <FiDownload /><span>Download Information</span>
                </button>
                <button onClick={() => downloadResume(selectedCandidate.resumeFile)} className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base">
                  <FiDownload /><span>Download Resume</span>
                </button>
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          ASSESSMENT VIEW MODAL
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAssessmentModal && viewingAssessment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAssessmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full sm:rounded-xl shadow-2xl sm:max-w-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                    {viewingAssessment.candidateName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate" style={{ color: '#020330' }}>
                      Assessment — {viewingAssessment.candidateName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{viewingAssessment.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">

                {/* Candidate basic info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Candidate Info
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                    <div>
                      <span className="text-gray-400 block text-xs mb-0.5">Name</span>
                      {viewingAssessment.assessmentData?.candidateName || viewingAssessment.candidateName}
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs mb-0.5">Email</span>
                      {viewingAssessment.assessmentData?.candidateEmail || viewingAssessment.email}
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs mb-0.5">Phone</span>
                      {viewingAssessment.assessmentData?.candidatePhone || viewingAssessment.phone}
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {Array.isArray(viewingAssessment.assessmentData?.remarks) &&
                viewingAssessment.assessmentData.remarks.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Remarks
                    </h4>
                    {viewingAssessment.assessmentData.remarks.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-4 py-3 border ${ROLE_COLORS[r.role] || ROLE_COLORS.recruiter}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <FiShield size={12} />
                          <span className="text-xs font-semibold uppercase">
                            {ROLE_LABELS[r.role] || r.role}
                          </span>
                          {r.submittedAt && (
                            <span className="ml-auto text-xs opacity-60 flex items-center gap-1">
                              <FiClock size={10} /> {formatDate(r.submittedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <FiFileText size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No remarks found in assessment</p>
                  </div>
                )}

                {/* Submitted at */}
                {viewingAssessment.assessmentData?.submittedAt && (
                  <p className="text-xs text-gray-400 text-right pt-1">
                    Submitted: {formatDate(viewingAssessment.assessmentData.submittedAt)}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default SearchResume;