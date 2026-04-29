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
  FiCheck
} from "react-icons/fi";
import { toast } from "react-toastify";

const SearchResume = () => {
  const { companyToken, backendUrl } = useContext(AppContext);
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification } = outletContext || {};

  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [matchingStats, setMatchingStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0,
    matchRate: 0
  });

  useEffect(() => {
    if (companyToken) {
      fetchCombinedData();
    }
  }, [companyToken]);

  useEffect(() => {
    filterAndSortData();
  }, [combinedData, searchQuery, filterStatus, sortBy]);

  // Listen for assessment tab completion → remove candidate from UI
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel("application_updates");
      bc.onmessage = (event) => {
        if (event.data?.type === "APPLICATION_ACCEPTED" && event.data?.applicationId) {
          setCombinedData(prev => prev.filter(c => c._id !== event.data.applicationId));
          toast.success("Candidate accepted via assessment.");
        }
      };
    } catch { /* BroadcastChannel not supported */ }
    return () => { try { bc?.close(); } catch { } };
  }, []);

  // Enhanced name extraction from resume filename
  const extractCandidateName = (text) => {
    if (!text) return "";
    
    // Remove file extension
    let name = text.replace(/\.(pdf|doc|docx)$/i, "");
    
    // Replace common separators with space FIRST (before keyword removal)
    name = name.replace(/[-_]/g, " ");
    
    // NOW remove common resume keywords (case insensitive)
    const keywordsToRemove = [
      'resume', 'cv', 'curriculum', 'vitae', 'qa', 'qe', 'engineer', 
      'developer', 'manager', 'analyst', 'tester', 'consultant',
      'updated', 'latest', 'new', 'final', 'v1', 'v2', 'v3'
    ];
    
    keywordsToRemove.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      name = name.replace(regex, '');
    });
    
    // Remove extra spaces and numbers
    name = name.replace(/\s+/g, " ")
                .replace(/\d+/g, "")
                .trim();
    
    // Capitalize each word
    name = name.split(' ')
               .filter(word => word.length > 0)
               .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
               .join(' ');
    
    return name;
  };

  // Normalize name for comparison (remove spaces, special chars, convert to lowercase)
  const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase()
               .replace(/\s+/g, "")
               .replace(/[^a-z]/g, "");
  };

  // Check if two names match
  const namesMatch = (name1, name2) => {
    const normalized1 = normalizeName(name1);
    const normalized2 = normalizeName(name2);
    
    // Exact match
    if (normalized1 === normalized2) return true;
    
    // One name contains the other (with length tolerance)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      const lengthDiff = Math.abs(normalized1.length - normalized2.length);
      if (lengthDiff <= 3) return true;
    }
    
    // Check if first word matches (first name matching)
    const words1 = name1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const words2 = name2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    if (words1.length > 0 && words2.length > 0) {
      const firstWord1 = normalizeName(words1[0]);
      const firstWord2 = normalizeName(words2[0]);
      
      // If first names match
      if (firstWord1 === firstWord2) return true;
      
      // Check for partial first name match (at least 4 characters)
      if (firstWord1.length >= 4 && firstWord2.length >= 4) {
        if (firstWord1.startsWith(firstWord2) || firstWord2.startsWith(firstWord1)) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Get CSV data by matching candidate name
  const getCsvDataByName = (candidateName, csvFile) => {
    if (!csvFile || !csvFile.data || !Array.isArray(csvFile.data)) return null;
    
    const matchingRow = csvFile.data.find((row, index) => {
      if (!row || row.length < 1) return false;
      
      // Skip header row
      if (index === 0 && row[0]?.toLowerCase().includes('full')) {
        return false;
      }
      
      const fullName = row[0] || '';
      return namesMatch(candidateName, fullName);
    });
    
    return matchingRow;
  };

  // Parse CSV row into structured data
  const parseCsvRow = (row) => {
    if (!row) return {};
    
    const data = {};
    const csvHeaders = [
      'Full Name', 'Gender', 'DOB', 'Mobile No', 
      'Email ID', 'Linkedin ID', 'Facebook ID', 'Instagram ID', 'Snapchat',
      'City', 'State', 'Languages', 'Marital Status',
      'Sector', 'Category', 'Product', 'Channel', 
      'Current Designation', 'Current Department', 'Current CTC', 'Expected CTC',
      'Notice Period', 'Total Experience', 'Status for Job Change'
    ];
    
    row.forEach((value, index) => {
      if (index < csvHeaders.length) {
        data[csvHeaders[index]] = value || "N/A";
      }
    });
    
    return data;
  };

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
        const resumes = resumesRes.data.data?.files || resumesRes.data.files || [];
        const csvFiles = csvRes.data.data?.files || csvRes.data.files || [];

        console.log('=== API RESPONSE ===');
        console.log('Resumes found:', resumes.length);
        console.log('CSV files found:', csvFiles.length);
        
        const parsedCsvFiles = await Promise.all(
          csvFiles.map(async (csvFile) => {
            if (csvFile.data && Array.isArray(csvFile.data) && csvFile.data.length > 0) {
              console.log('CSV already has data:', csvFile.originalName);
              return csvFile;
            }
            
            console.log('Fetching CSV content for:', csvFile.originalName);
            try {
              const response = await axios.get(`${backendUrl}/api/bulk-upload/download/${csvFile._id}`, {
                headers: { token: companyToken },
                responseType: 'blob'
              });
              
              const fileName = csvFile.originalName.toLowerCase();
              
              // Handle Excel files (.xlsx, .xls)
              if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                console.log('Parsing Excel file:', csvFile.originalName);
                const arrayBuffer = await response.data.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                
                console.log('Excel parsed successfully. Rows:', jsonData.length);
                
                return {
                  ...csvFile,
                  data: jsonData.filter(row => row.some(cell => cell !== ''))
                };
              }
              // Handle CSV files
              else if (fileName.endsWith('.csv')) {
                console.log('Parsing CSV file:', csvFile.originalName);
                const text = await response.data.text();
                const firstLine = text.split('\n')[0];
                const delimiter = firstLine.includes('\t') ? '\t' : ',';
                
                console.log('Detected delimiter:', delimiter === '\t' ? 'TAB' : 'COMMA');
                
                const rows = text.split('\n').map(row => {
                  if (delimiter === '\t') {
                    return row.split('\t').map(cell => cell.trim());
                  } else {
                    const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;
                    return row.match(regex)?.map(cell => cell.replace(/^"|"$/g, '').trim()) || [];
                  }
                }).filter(row => row.length > 1 && row.some(cell => cell !== ''));
                
                console.log('CSV parsed successfully. Rows:', rows.length);
                
                return {
                  ...csvFile,
                  data: rows
                };
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
          const extractedName = extractCandidateName(resumeFileName);
          
          console.log('Processing resume:', resumeFileName, '-> Extracted name:', extractedName);
          
          const candidateName = resume.parsedData?.name || extractedName;
          
          let csvMatch = null;
          let csvMatchedData = null;
          
          for (const csvFile of parsedCsvFiles) {
            csvMatchedData = getCsvDataByName(candidateName, csvFile);
            if (csvMatchedData) {
              csvMatch = csvFile;
              console.log('✓ Match found for:', candidateName, 'in CSV:', csvFile.originalName);
              break;
            }
          }

          if (!csvMatchedData) {
            console.log('✗ No match found for:', candidateName);
          }

          const parsedCsv = csvMatchedData ? parseCsvRow(csvMatchedData) : null;

          return {
            _id: resume._id,
            resumeName: resumeFileName,
            candidateName: candidateName,
            email: parsedCsv?.['Email ID'] || resume.parsedData?.email || "N/A",
            phone: parsedCsv?.['Mobile No'] || resume.parsedData?.phone || "N/A",
            location: `${parsedCsv?.['City'] || ''} ${parsedCsv?.['State'] || ''}`.trim() || resume.parsedData?.location || "N/A",
            skills: parsedCsv?.['Languages'] || resume.parsedData?.skills || "N/A",
            experience: parsedCsv?.['Total Experience'] || resume.parsedData?.experience || "N/A",
            status: resume.status,
            fileSize: resume.fileSize,
            uploadDate: resume.uploadDate || resume.createdAt,
            resumeFile: resume,
            
            csvData: parsedCsv,
            csvMatched: !!csvMatchedData,
            csvFileName: csvMatch?.originalName || "N/A",
            
            fullName: parsedCsv?.['Full Name'] || candidateName,
            gender: parsedCsv?.['Gender'] || "N/A",
            dob: parsedCsv?.['DOB'] || "N/A",
            city: parsedCsv?.['City'] || "N/A",
            state: parsedCsv?.['State'] || "N/A",
            languages: parsedCsv?.['Languages'] || "N/A",
            maritalStatus: parsedCsv?.['Marital Status'] || "N/A",
            
            linkedinId: parsedCsv?.['Linkedin ID'] || "N/A",
            facebookId: parsedCsv?.['Facebook ID'] || "N/A",
            instagramId: parsedCsv?.['Instagram ID'] || "N/A",
            snapchat: parsedCsv?.['Snapchat'] || "N/A",
            
            sector: parsedCsv?.['Sector'] || "N/A",
            category: parsedCsv?.['Category'] || "N/A",
            product: parsedCsv?.['Product'] || "N/A",
            channel: parsedCsv?.['Channel'] || "N/A",
            currentDesignation: parsedCsv?.['Current Designation'] || "N/A",
            currentDepartment: parsedCsv?.['Current Department'] || "N/A",
            
            currentCTC: parsedCsv?.['Current CTC'] || "N/A",
            expectedCTC: parsedCsv?.['Expected CTC'] || "N/A",
            noticePeriod: parsedCsv?.['Notice Period'] || "N/A",
            totalExperience: parsedCsv?.['Total Experience'] || "N/A",
            jobChangeStatus: parsedCsv?.['Status for Job Change'] || "N/A"
          };
        });

        const totalResumes = combined.length;
        const matchedResumes = combined.filter(c => c.csvMatched).length;
        const unmatchedResumes = totalResumes - matchedResumes;
        const matchRate = totalResumes > 0 ? Math.round((matchedResumes / totalResumes) * 100) : 0;

        setMatchingStats({
          total: totalResumes,
          matched: matchedResumes,
          unmatched: unmatchedResumes,
          matchRate: matchRate
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

  const filterAndSortData = () => {
    let filtered = combinedData.filter(item => {
      const matchesSearch = 
        item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.phone || '').includes(searchQuery) ||
        item.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.currentDesignation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.currentDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.currentCTC.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.languages.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        filterStatus === "all" ||
        (filterStatus === "matched" && item.csvMatched) ||
        (filterStatus === "unmatched" && !item.csvMatched);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.candidateName.localeCompare(b.candidateName);
      } else if (sortBy === "date") {
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      } else if (sortBy === "matched") {
        return (b.csvMatched ? 1 : 0) - (a.csvMatched ? 1 : 0);
      }
      return 0;
    });

    setFilteredData(filtered);
  };

  const downloadResume = async (resumeFile) => {
    try {
      const response = await axios.get(`${backendUrl}/api/bulk-upload/download/${resumeFile._id}`, {
        headers: { token: companyToken },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
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
      // Create CSV data with all candidate information
      const csvData = [
        ['Field', 'Value'],
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
        ['Professional Details', ''],
        ['Sector', candidate.sector],
        ['Category', candidate.category],
        ['Product', candidate.product],
        ['Channel', candidate.channel],
        ['Current Designation', candidate.currentDesignation],
        ['Current Department', candidate.currentDepartment],
        [''],
        ['Compensation & Experience', ''],
        ['Current CTC', candidate.currentCTC],
        ['Expected CTC', candidate.expectedCTC],
        ['Total Experience', candidate.totalExperience],
        ['Notice Period', candidate.noticePeriod],
        ['Job Change Status', candidate.jobChangeStatus],
        [''],
        ['Social Media', ''],
        ['LinkedIn', candidate.linkedinId],
        ['Facebook', candidate.facebookId],
        ['Instagram', candidate.instagramId],
        ['Snapchat', candidate.snapchat],
      ];

      // Convert to Excel using XLSX
      const ws = XLSX.utils.aoa_to_sheet(csvData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Field column
        { wch: 50 }  // Value column
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Candidate Information');

      // Generate Excel file and download
      XLSX.writeFile(wb, `${candidate.candidateName}_Information.xlsx`);
      
      toast.success("Candidate information downloaded");
    } catch (error) {
      console.error("Download info error:", error);
      toast.error("Failed to download candidate information");
    }
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
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
    if (selectedCandidates.length === 0) {
      toast.warning("Please select at least one candidate");
      return;
    }

    toast.info(`Downloading ${selectedCandidates.length} resume(s)...`);
    
    for (const candidateId of selectedCandidates) {
      const candidate = combinedData.find(c => c._id === candidateId);
      if (candidate) {
        try {
          await downloadResume(candidate.resumeFile);
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
        } catch (error) {
          console.error("Error downloading resume:", error);
        }
      }
    }
    
    toast.success(`Downloaded ${selectedCandidates.length} resume(s)`);
  };

  const downloadSelectedInformation = () => {
    if (selectedCandidates.length === 0) {
      toast.warning("Please select at least one candidate");
      return;
    }

    try {
      const selectedData = combinedData.filter(c => selectedCandidates.includes(c._id));
      
      // Create Excel with all selected candidates
      const excelData = [
        [
          'Sr. No.', 'Full Name', 'Gender', 'DOB', 'Email', 'Phone', 'City', 'State',
          'Marital Status', 'Languages', 'Sector', 'Category', 'Product', 'Channel',
          'Current Designation', 'Current Department', 'Current CTC', 'Expected CTC',
          'Total Experience', 'Notice Period', 'Job Change Status', 'LinkedIn',
          'Facebook', 'Instagram', 'Snapchat'
        ]
      ];

      selectedData.forEach((candidate, index) => {
        excelData.push([
          index + 1,
          candidate.fullName,
          candidate.gender,
          candidate.dob,
          candidate.email,
          candidate.phone,
          candidate.city,
          candidate.state,
          candidate.maritalStatus,
          candidate.languages,
          candidate.sector,
          candidate.category,
          candidate.product,
          candidate.channel,
          candidate.currentDesignation,
          candidate.currentDepartment,
          candidate.currentCTC,
          candidate.expectedCTC,
          candidate.totalExperience,
          candidate.noticePeriod,
          candidate.jobChangeStatus,
          candidate.linkedinId,
          candidate.facebookId,
          candidate.instagramId,
          candidate.snapchat
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = excelData[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...excelData.map(row => String(row[colIndex] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;

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
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        {/* ========== RESPONSIVE HEADER ========== */}
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

        {/* ========== RESPONSIVE SEARCH AND FILTER ========== */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4">
            {/* Search Box */}
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

            {/* Sort By */}
            {/* <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full lg:flex-1 px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="matched">Sort by Match Status</option>
            </select> */}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setFilterStatus("all")}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                filterStatus === "all"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All ({combinedData.length})
            </button>
            <button
              onClick={() => setFilterStatus("matched")}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                filterStatus === "matched"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Matched ({combinedData.filter(d => d.csvMatched).length})
            </button>
            <button
              onClick={() => setFilterStatus("unmatched")}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                filterStatus === "unmatched"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Unmatched ({combinedData.filter(d => !d.csvMatched).length})
            </button>
          </div>

          {/* Bulk Action Buttons */}
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
                  <FiDownload />
                  <span>Download Resumes</span>
                </button>
                <button
                  onClick={downloadSelectedInformation}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FiDownload />
                  <span>Download Information</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCandidates([]);
                    setSelectAll(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <FiX />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========== RESPONSIVE TABLE / LOADING / EMPTY STATE ========== */}
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

            {/* Mobile Tip */}
            <div className="block lg:hidden p-3 bg-blue-50 border-b border-blue-200">
              <p className="text-xs text-blue-800 text-center">
                💡 Swipe left to see all columns →
              </p>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
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
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate._id)}
                          onChange={() => handleSelectCandidate(candidate._id)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </td>
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
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex justify-center items-center flex-wrap gap-1 sm:gap-2">
                          {/* CV Download */}
                          <button
                            onClick={() => downloadResume(candidate.resumeFile)}
                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download CV"
                          >
                            <FiDownload size={16} />
                          </button>
                          {/* Accept → opens Assessment in new tab */}
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
                          {/* Reject → remove from UI */}
                          <button
                            onClick={() => {
                              setCombinedData(prev => prev.filter(c => c._id !== candidate._id));
                              toast.info(`${candidate.candidateName} rejected`);
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
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-8 text-center">
            <FiFileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2 text-sm sm:text-base">No resumes found</p>
            <p className="text-xs sm:text-sm text-gray-500">
              Upload resumes and CSV files to see combined data here
            </p>
          </div>
        )}
      </div>

      {/* ========== RESPONSIVE DETAIL MODAL ========== */}
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
              {/* Modal Header - Responsive */}
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
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Modal Content - Responsive with Scroll */}
              <div className="flex-1 overflow-auto p-4 sm:p-6">
                {/* Contact Information */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>
                    📋 Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Full Name</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.fullName}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Gender</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.gender}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Date of Birth</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.dob}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Email</label>
                      <div className="flex items-center gap-2 text-gray-900 text-sm">
                        <FiMail size={14} className="text-red-500 flex-shrink-0" />
                        <a href={`mailto:${selectedCandidate.email}`} className="hover:text-red-500 break-all">
                          {selectedCandidate.email}
                        </a>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Phone</label>
                      <div className="flex items-center gap-2 text-gray-900 text-sm">
                        <FiPhone size={14} className="text-red-500 flex-shrink-0" />
                        <a href={`tel:${selectedCandidate.phone}`} className="hover:text-red-500">
                          {selectedCandidate.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>
                    💼 Professional Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Sector</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.sector}</p>
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Category</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.category}</p>
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Product</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.product}</p>
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Channel</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.channel}</p>
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Current Designation</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.currentDesignation}</p>
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Current Department</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.currentDepartment}</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>
                    👤 Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">City</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.city}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">State</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.state}</p>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Marital Status</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.maritalStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Compensation & Experience */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>
                    💰 Compensation & Experience
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Current CTC</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.currentCTC}</p>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Expected CTC</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.expectedCTC}</p>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Total Experience</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.totalExperience}</p>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Notice Period</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.noticePeriod}</p>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500 sm:col-span-2">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Job Change Status</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedCandidate.jobChangeStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>
                    🔗 Social Media Links
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">LinkedIn ID</label>
                      <a 
                        href={selectedCandidate.linkedinId !== "N/A" ? `https://linkedin.com/in/${selectedCandidate.linkedinId}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {selectedCandidate.linkedinId}
                      </a>
                    </div>
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Facebook ID</label>
                      <p className="text-sm text-gray-900 font-medium break-all">{selectedCandidate.facebookId}</p>
                    </div>
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Instagram ID</label>
                      <p className="text-sm text-gray-900 font-medium break-all">{selectedCandidate.instagramId}</p>
                    </div>
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-xs sm:text-sm text-gray-600 block mb-1">Snapchat</label>
                      <p className="text-sm text-gray-900 font-medium break-all">{selectedCandidate.snapchat}</p>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-6">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#020330' }}>
                    🗣️ Languages
                  </h4>
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-900">{selectedCandidate.languages}</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => downloadCandidateInfo(selectedCandidate)}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <FiDownload />
                  <span>Download Information</span>
                </button>
                <button
                  onClick={() => downloadResume(selectedCandidate.resumeFile)}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  <FiDownload />
                  <span>Download Resume</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
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