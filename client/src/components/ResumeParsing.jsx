import React, { useContext, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FileText, Upload, RefreshCw, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const MAX_RESUME_BYTES = 500 * 1024; // matches the server's upload limit

// Candidate "Resume Parsing" — upload a resume, the server reads it and fills
// the profile, then the candidate lands on My Profile to review the details.
const ResumeParsing = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { backendUrl, userData, fetchUserData } = useContext(AppContext);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const hasResume = typeof userData?.resume === "string" && userData.resume.trim() !== "";

  const selectFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed for resume");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast.error("Resume size must be less than 500KB");
      return;
    }
    setResume(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const uploadResume = async () => {
    if (!user) { toast.error("Please login to upload resume."); return; }
    if (!resume) { toast.error("Please select a resume file."); return; }
    setIsUploading(true);
    try {
      const token = await getToken();
      if (!token) { toast.error("Authentication failed. Please login again."); return; }
      const formData = new FormData();
      formData.append("resume", resume);
      // The server parses the resume and updates the profile fields
      const response = await fetch(`${backendUrl}/api/users/update-resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await fetchUserData();
        navigate("/applications/my-profile");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: "#020330" }}>Resume Parsing</h2>
        <p className="text-gray-600">
          Upload your resume and we'll fill in your profile details automatically.
          You can review and edit everything on My Profile afterwards.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-lg"
      >
        {hasResume && (
          <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              You already have a resume uploaded. Uploading a new one replaces it and updates your
              profile with the latest details.
            </p>
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={() => !isUploading && inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !isUploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl px-6 py-12 cursor-pointer transition-colors duration-200 ${
            isDragging ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50/40"
          }`}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ background: "#FF0000" }}>
            <Upload className="w-6 h-6 text-white" />
          </div>
          {resume ? (
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <FileText className="w-4 h-4 text-red-600" />
              <span className="break-all">{resume.name}</span>
              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setResume(null); }}
                  className="p-1 rounded text-gray-400 hover:text-gray-700"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-gray-800 font-medium">Drag & drop your resume here, or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">PDF only, up to 500KB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => { selectFile(e.target.files?.[0]); e.target.value = ""; }}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/applications/my-profile")}
            disabled={isUploading}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            Skip for now
          </button>
          <motion.button
            onClick={uploadResume}
            disabled={isUploading || !resume}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center w-full sm:w-auto px-6 py-3 font-medium rounded-lg transition-all duration-200 shadow-lg ${
              isUploading || !resume ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-white"
            }`}
            style={!isUploading && resume ? { background: "#FF0000", boxShadow: "0 0 20px rgba(255, 0, 0, 0.25)" } : {}}
          >
            {isUploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isUploading ? "Reading your resume..." : "Upload & Continue"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeParsing;
