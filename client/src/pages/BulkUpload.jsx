import React, { useState, useContext, useRef, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import * as XLSX from 'xlsx';
import {
  FiUpload,
  FiDownload,
  FiFileText,
  FiDatabase,
  FiAlertCircle,
  FiRefreshCw
} from "react-icons/fi";

const BulkUpload = () => {
  const { companyToken, backendUrl } = useContext(AppContext);
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification } = outletContext || {};
  
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("resumes");
  const [dragActive, setDragActive] = useState(false);
  const [stats, setStats] = useState({
    resumes: { totalResumes: 0, processedResumes: 0, failedResumes: 0, totalSize: 0 },
    csv: { totalCSVs: 0, processedCSVs: 0, failedCSVs: 0, totalRows: 0, totalSize: 0 }
  });
  
  const resumeInputRef = useRef(null);
  const csvInputRef = useRef(null);

  useEffect(() => {
    if (companyToken) {
      fetchStats();
    }
  }, [companyToken, activeTab]);

  // Download sample format function
  const downloadSampleFormat = async () => {
    try {
      // Fetch the sample format file from uploads
      const response = await axios.get(`${backendUrl}/api/bulk-upload/sample-format`, {
        headers: { token: companyToken },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_format.xls');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Sample format downloaded successfully!");
    } catch (error) {
      console.error("Error downloading sample format:", error);
      // If API endpoint doesn't exist, create a sample format locally
      createLocalSampleFormat();
    }
  };

  // Create sample format locally if API endpoint doesn't exist
  const createLocalSampleFormat = () => {
    try {
      // Create sample data structure with the exact headings requested
      const sampleData = [
        [
          'Full Name', 'Gender', 'DOB', 'Mobile No', 'Email ID', 'Linkedin ID', 'Facebook ID', 
          'Instagram ID', 'Snapchat', 'City', 'State', 'Languages', 'Marital Status', 'Sector', 
          'Category', 'Product', 'Channel', 'Current Designation', 'Current Department', 
          'Current CTC', 'Expected CTC', 'Notice Period', 'Total Experience', 'Status for Job Change'
        ],
        [
          'John Doe', 'Male', '15/01/1990', '9876543210', 'john.doe@example.com', 
          'linkedin.com/in/johndoe', 'facebook.com/johndoe', 'instagram.com/johndoe', 
          'johndoe_snap', 'Mumbai', 'Maharashtra', 'English, Hindi', 'Single', 
          'IT Services', 'Software Development', 'Web Applications', 'Direct', 
          'Senior Developer', 'Engineering', '12 LPA', '15 LPA', '2 Months', 
          '5 Years', 'Actively Looking'
        ],
        [
          'Jane Smith', 'Female', '22/05/1992', '9876543211', 'jane.smith@example.com', 
          'linkedin.com/in/janesmith', '', '', '', 'Delhi', 'Delhi', 'English, Hindi, Punjabi', 
          'Married', 'Banking', 'Finance', 'Retail Banking', 'Branch', 'Branch Manager', 
          'Operations', '10 LPA', '13 LPA', '1 Month', '7 Years', 'Open to Opportunities'
        ],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sampleData);

      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 20 }, // Full Name
        { wch: 10 }, // Gender
        { wch: 12 }, // DOB
        { wch: 15 }, // Mobile No
        { wch: 30 }, // Email ID
        { wch: 30 }, // Linkedin ID
        { wch: 25 }, // Facebook ID
        { wch: 25 }, // Instagram ID
        { wch: 20 }, // Snapchat
        { wch: 15 }, // City
        { wch: 15 }, // State
        { wch: 20 }, // Languages
        { wch: 15 }, // Marital Status
        { wch: 20 }, // Sector
        { wch: 20 }, // Category
        { wch: 20 }, // Product
        { wch: 15 }, // Channel
        { wch: 20 }, // Current Designation
        { wch: 20 }, // Current Department
        { wch: 12 }, // Current CTC
        { wch: 12 }, // Expected CTC
        { wch: 15 }, // Notice Period
        { wch: 15 }, // Total Experience
        { wch: 20 }, // Status for Job Change
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Candidate Data');

      // Generate Excel file and trigger download
      XLSX.writeFile(wb, 'sample_format.xlsx');
      
      toast.success("Sample format downloaded successfully!");
    } catch (error) {
      console.error("Error creating sample format:", error);
      toast.error("Failed to download sample format. Please try again.");
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/bulk-upload/stats`, {
        headers: { token: companyToken }
      });

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      await axios.get(`${backendUrl}/api/bulk-upload/files`, {
        headers: { token: companyToken }
      });
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <div className="text-center">
          <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-xl sm:text-2xl text-gray-600 mb-4">Please login as a company first</p>
          <p className="text-gray-500">You need to be logged in to upload files</p>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (files, type) => {
    if (!files || files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    const filesArray = Array.from(files);
    console.log('Files to upload:', filesArray.length);
    console.log('Upload type:', type);

    const validFiles = filesArray.filter(file => {
      console.log('Checking file:', file.name, 'Type:', file.type);
      
      if (type === "resumes") {
        const isValid = file.type === "application/pdf" || 
               file.name.toLowerCase().endsWith('.pdf') ||
               file.name.toLowerCase().endsWith('.doc') ||
               file.name.toLowerCase().endsWith('.docx') ||
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               file.type === 'application/msword';
        
        if (!isValid) {
          console.log('Invalid resume file:', file.name);
        }
        return isValid;
      } else {
        const isValid = file.type === "text/csv" || 
               file.name.toLowerCase().endsWith('.csv') ||
               file.type === 'application/csv' ||
               file.type === 'application/vnd.ms-excel' ||
               file.name.toLowerCase().endsWith('.xlsx') ||
               file.name.toLowerCase().endsWith('.xls') ||
               file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               file.type === 'application/vnd.ms-excel';
        
        if (!isValid) {
          console.log('Invalid CSV/Excel file:', file.name);
        }
        return isValid;
      }
    });

    console.log('Valid files:', validFiles.length);

    if (validFiles.length === 0) {
      toast.error(
        type === "resumes" 
          ? "Please select valid resume files (PDF, DOC, DOCX)"
          : "Please select valid CSV or Excel files (CSV, XLSX, XLS)"
      );
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      
      const fieldName = type === "resumes" ? 'resumes' : 'csvFiles';
      console.log('Using field name:', fieldName);
      
      validFiles.forEach((file, index) => {
        console.log(`Adding file ${index + 1}:`, file.name, 'Size:', file.size);
        formData.append(fieldName, file);
      });

      if (type === "csv") {
        formData.append('dataType', 'general');
      }

      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      }

      const endpoint = type === "resumes" 
        ? `${backendUrl}/api/bulk-upload/upload-resumes`
        : `${backendUrl}/api/bulk-upload/upload-csv`;

      console.log('Uploading to:', endpoint);

      const { data } = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'token': companyToken
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });

      console.log('Upload response:', data);

      if (data.success) {
        toast.success(data.message);
        
        await fetchUploadedFiles();
        await fetchStats();
        
        const { processedFiles, failedFiles, totalFiles } = data.data;
        if (failedFiles > 0) {
          toast.warning(`${processedFiles}/${totalFiles} files processed successfully. ${failedFiles} files failed.`);
        }
        
        // Show name extraction info for resumes
        if (type === "resumes") {
          toast.info("Resume names extracted successfully. Please upload CSV to match candidate data.");
        }
      } else {
        toast.error(data.message || "Upload failed");
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload files. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files, activeTab);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="container p-4 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: '#020330' }}
              >
                Bulk Upload
              </h1>
              <p className="text-gray-600">Upload multiple resumes or CSV/Excel files for bulk processing</p>
            </div>
            <button
              onClick={() => {
                fetchUploadedFiles();
                fetchStats();
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={20} />
            </button>
          </div>
        </motion.div>

        {/* Important Note */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <FiAlertCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">How Name Matching Works</h3>
              <p className="text-sm text-blue-700">
                1. Upload resumes first (filename should contain candidate name, e.g., "Afroz_Resume.pdf")<br/>
                2. Upload CSV with candidate details (ensure "Full Name" column matches resume filenames)<br/>
                3. Go to "Search Resume" to view matched data
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-8">
          <button
            onClick={() => setActiveTab("resumes")}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "resumes"
                ? "text-white shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
            style={{ backgroundColor: activeTab === "resumes" ? "#FF0000" : "transparent" }}
          >
            <FiFileText />
            <span>Resume Upload</span>
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "csv"
                ? "text-white shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
            style={{ backgroundColor: activeTab === "csv" ? "#FF0000" : "transparent" }}
          >
            <FiDatabase />
            <span>CSV/Excel Upload</span>
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive 
                ? "border-red-400 bg-red-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: '#FF0000' }}
              >
                {isUploading ? (
                  <FiRefreshCw className="text-white text-2xl animate-spin" />
                ) : (
                  <FiUpload className="text-white text-2xl" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#020330' }}>
                {activeTab === "resumes" ? "Upload Resume Files" : "Upload CSV or Excel Files"}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {activeTab === "resumes"
                  ? "Drag and drop PDF, DOC, or DOCX files here, or click to browse"
                  : "Drag and drop CSV or Excel files here, or click to browse"
                }
              </p>

              {activeTab === "csv" && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md w-full">
                  <p className="text-sm text-blue-800 mb-2 flex items-center gap-2">
                    <FiDownload className="flex-shrink-0" />
                    Please download the sample format file, fill in the details, and then upload
                  </p>
                  <button
                    onClick={downloadSampleFormat}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full"
                  >
                    <FiDownload />
                    <span>Download Sample Format</span>
                  </button>
                </div>
              )}

              <input
                ref={activeTab === "resumes" ? resumeInputRef : csvInputRef}
                type="file"
                multiple
                accept={activeTab === "resumes" ? ".pdf,.doc,.docx" : ".csv,.xlsx,.xls"}
                onChange={(e) => handleFileUpload(e.target.files, activeTab)}
                className="hidden"
                disabled={isUploading}
              />

              <button
                onClick={() => {
                  if (activeTab === "resumes") {
                    resumeInputRef.current?.click();
                  } else {
                    csvInputRef.current?.click();
                  }
                }}
                disabled={isUploading}
                className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
                style={{ backgroundColor: '#FF0000' }}
              >
                {isUploading ? "Uploading..." : "Browse Files"}
              </button>

              <p className="text-xs text-gray-500 mt-2">
                {activeTab === "resumes"
                  ? "Supported formats: PDF, DOC, DOCX"
                  : "Supported formats: CSV, XLSX, XLS"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview - Only show for CSV tab */}
        {activeTab === "csv" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#FF0000' }}>
              <p className="text-gray-500 text-sm mb-1">Total Files</p>
              <p className="text-2xl font-bold" style={{ color: '#FF0000' }}>
                {stats.csv.totalCSVs}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#00C851' }}>
              <p className="text-gray-500 text-sm mb-1">Processed</p>
              <p className="text-2xl font-bold" style={{ color: '#00C851' }}>
                {stats.csv.processedCSVs}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#FF9800' }}>
              <p className="text-gray-500 text-sm mb-1">Total Rows</p>
              <p className="text-2xl font-bold" style={{ color: '#FF9800' }}>
                {stats.csv.totalRows.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#2196F3' }}>
              <p className="text-gray-500 text-sm mb-1">Total Size</p>
              <p className="text-2xl font-bold" style={{ color: '#2196F3' }}>
                {formatFileSize(stats.csv.totalSize)}
              </p>
            </div>
          </motion.div>
        )}

      </div>

    </motion.div>
  );
};

export default BulkUpload;