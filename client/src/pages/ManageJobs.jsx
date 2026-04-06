import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { motion } from "framer-motion";

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 10;
  const { backendUrl, companyToken, setShowRecruiterLogin } = useContext(AppContext);
  
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification, setShowRecruiterLogin: setShowRecruiterLoginFromContext } = outletContext || {};

  const fetchCompanyJobs = async () => {
    setIsLoading(true);
    try {
      if (!companyToken) {
        setIsLoading(false);
        return;
      }
      
      const { data } = await axios.get(backendUrl + "/api/company/list-jobs", {
        headers: { token: companyToken },
      });

      if (data.success && Array.isArray(data.jobsData)) {
        const sorted = [...data.jobsData].sort((a, b) => new Date(b.date) - new Date(a.date));
        setJobs(sorted);
        setCurrentPage(1);
      } else {
        setJobs([]);
        toast.error(data.message || "Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error in fetchCompanyJobs:", error);
      setJobs([]);
      
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(error.message || "Failed to fetch jobs");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changeJobVisiblity = async (id) => {
    try {
      if (!companyToken) {
        toast.error("Please login as a company first");
        return;
      }

      const { data } = await axios.post(
        backendUrl + "/api/company/change-visibility",
        { id },
        {
          headers: { token: companyToken },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchCompanyJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error changing visibility:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const deleteJob = async (id) => {
    try {
      if (!companyToken) {
        toast.error("Please login as a company first");
        return;
      }

      const { data } = await axios.delete(
        backendUrl + `/api/jobs/${id}`,
        {
          headers: { token: companyToken },
        }
      );
      
      if (data.success) {
        toast.success(data.message);
        setDeleteConfirm(null);
        fetchCompanyJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobs();
    } else {
      setIsLoading(false);
    }
  }, [companyToken]);

  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <div className="text-center">
          <p className="text-xl sm:text-2xl text-gray-600 mb-4">Please login as a company first</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loading />;

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <p className="text-xl sm:text-2xl text-gray-600">No Jobs Available or posted</p>
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
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#020330' }}>
              Delete Job?
            </h3>
            <p className="text-gray-600 text-center mb-2">
              Are you sure you want to delete this job?
            </p>
            <p className="text-center font-medium mb-6" style={{ color: '#020330' }}>
              "{deleteConfirm.title}"
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(deleteConfirm._id)}
                className="flex-1 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity font-medium"
                style={{ backgroundColor: '#FF0000' }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container p-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: '#020330' }}
              >
                Manage Jobs
              </h1>
              <p className="text-gray-600">View, update, and manage your job listings</p>
            </div>
            <button
              onClick={() => navigate("/dashboard/add-job")}
              className="text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition duration-300 ease-in-out flex items-center gap-2 shadow-md"
              style={{ backgroundColor: '#FF0000' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add new Job
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              className="bg-white rounded-xl shadow-md p-5 border-l-4"
              style={{ borderLeftColor: '#FF0000' }}
            >
              <p className="text-gray-500 text-sm mb-1">Total Jobs</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: '#FF0000' }}
              >
                {jobs.length}
              </p>
            </div>
            <div 
              className="bg-white rounded-xl shadow-md p-5 border-l-4"
              style={{ borderLeftColor: '#FF0000' }}
            >
              <p className="text-gray-500 text-sm mb-1">Active Jobs</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: '#FF0000' }}
              >
                {jobs.filter((job) => job.visible).length}
              </p>
            </div>
            <div 
              className="bg-white rounded-xl shadow-md p-5 border-l-4"
              style={{ borderLeftColor: '#FF0000' }}
            >
              <p className="text-gray-500 text-sm mb-1">Total Applicants</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: '#FF0000' }}
              >
                {jobs.reduce((sum, job) => sum + (job.applicants || 0), 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto w-full">
            <table className="w-full" style={{ color: '#020330' }}>
              <thead 
                className="border-b"
                style={{ backgroundColor: '#F8F9FA' }}
              >
                <tr>
                  <th 
                    className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    #
                  </th>
                  <th 
                    className="py-4 px-6 text-left sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Job Title
                  </th>
                  <th 
                    className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Date
                  </th>
                  <th 
                    className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Location
                  </th>
                  <th 
                    className="py-4 px-6 text-center sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    <span className="flex items-center justify-center">Applicants</span>
                  </th>
                  <th 
                    className="py-4 px-6 text-center sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Visible
                  </th>
                  <th 
                    className="py-4 px-6 text-center sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE).map((job, index) => (
                  <tr
                    key={job._id || index}
                    className="sm:text-[15px] border-b hover:bg-gray-50 transition-colors"
                    style={{ color: '#020330' }}
                  >
                    <td className="py-4 px-6 max-sm:hidden">{(currentPage - 1) * JOBS_PER_PAGE + index + 1}</td>
                    <td 
                      className="py-4 px-6 font-medium"
                      style={{ color: '#020330' }}
                    >
                      {job.title}
                    </td>
                    <td className="py-4 px-6 max-sm:hidden text-gray-600">
                      {job.date ? moment(job.date).format("ll") : "N/A"}
                    </td>
                    <td className="py-4 px-6 max-sm:hidden text-gray-600">
                      {job.location || "N/A"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            job.applicants > 0
                              ? "text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          style={job.applicants > 0 ? { backgroundColor: '#FF0000' } : {}}
                        >
                          {job.applicants || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            onChange={() => changeJobVisiblity(job._id)}
                            className="sr-only peer"
                            type="checkbox"
                            checked={job.visible}
                          />
                          <div 
                            className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                            style={{ 
                              '--tw-ring-color': '#FF0000',
                              '--peer-checked-bg': '#FF0000'
                            }}
                          >
                            <style jsx>{`
                              .peer:checked ~ div {
                                background-color: #FF0000 !important;
                              }
                              .peer:focus ~ div {
                                box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.2) !important;
                              }
                            `}</style>
                          </div>
                        </label>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setDeleteConfirm(job)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
                          title="Delete Job"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {jobs.length > JOBS_PER_PAGE && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * JOBS_PER_PAGE + 1}–{Math.min(currentPage * JOBS_PER_PAGE, jobs.length)} of {jobs.length} jobs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ color: '#020330' }}
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(jobs.length / JOBS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                  style={
                    page === currentPage
                      ? { backgroundColor: '#FF0000', color: '#fff' }
                      : { color: '#020330', border: '1px solid #e5e7eb' }
                  }
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(jobs.length / JOBS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(jobs.length / JOBS_PER_PAGE)}
                className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ color: '#020330' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default ManageJobs;