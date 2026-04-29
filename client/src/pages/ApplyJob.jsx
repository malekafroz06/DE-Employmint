import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import kConvert from "k-convert";
import moment from "moment";
import JobCard from "../components/JobCard";
import Footer from "../components/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import Calltoaction from "../components/Calltoaction";
import { motion } from "framer-motion";
import { FiMapPin, FiBriefcase, FiClock, FiCheckCircle, FiExternalLink } from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";

// Company Logo Component with loading state and fallback
const CompanyLogo = ({ companyData }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if image exists and is valid
  const hasValidImage = companyData?.image && 
    companyData.image !== assets.placeholder &&
    !imageError;

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="bg-white p-3 rounded-lg shadow-lg border border-white/20 flex items-center justify-center relative overflow-hidden"
      style={{ 
        width: '88px', 
        height: '88px',
        minWidth: '88px',
        minHeight: '88px'
      }}
    >
      {hasValidImage ? (
        <>
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          {/* Actual image */}
          <img
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            src={companyData.image}
            alt={`${companyData?.name || 'Company'} Logo`}
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            loading="eager"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }}
          />
        </>
      ) : (
        // Fallback: Show first letter of company name
        <span className="text-3xl font-bold text-gray-700">
          {companyData?.name?.[0]?.toUpperCase() || 'C'}
        </span>
      )}
    </motion.div>
  );
};
const ApplyJob = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [jobData, setJobData] = useState(null);
  const [isAlreadyApplied, setAlreadyApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [similarCurrentSlide, setSimilarCurrentSlide] = useState(0);
  const [similarJobsPerSlide] = useState(1);

  const {
    jobs = [],
    backendUrl,
    userData,
    userApplications = [],
    fetchUserApplications,
  } = useContext(AppContext);

  // Preload company image
  useEffect(() => {
    if (jobData?.companyId?.image) {
      const img = new Image();
      img.src = jobData.companyId.image;
    }
  }, [jobData?.companyId?.image]);

  // Fetch job details
  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      
      if (data.success) {
        const job = data.job || data.data;
        setJobData(job);
        findSimilarJobs(job);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error(data.message || "Job not found");
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching job:', error);
      
      if (error.response?.status === 404) {
        toast.error("Job not found. It may have been removed or the link is invalid.");
        findJobInContext();
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Failed to fetch job details. Please check your connection.");
        findJobInContext();
      }
    }
  };

  // Fallback: Find job in context
  const findJobInContext = () => {
    if (jobs && jobs.length > 0) {
      const foundJob = jobs.find(job => job._id === id);
      if (foundJob) {
        setJobData(foundJob);
        findSimilarJobs(foundJob);
        setIsLoading(false);
        toast.success("Job found in local data");
      } else {
        toast.error("Job not found anywhere. Please try again later.");
        setTimeout(() => {
          window.history.back();
        }, 2000);
      }
    }
  };

  // Find similar jobs
  const findSimilarJobs = (currentJob) => {
    if (!jobs || jobs.length === 0) {
      setSimilarJobs([]);
      return;
    }

    const similar = jobs.filter(job => 
      job._id !== currentJob._id && 
      (job.companyId?._id === currentJob.companyId?._id || 
       job.designation === currentJob.designation)
    ).slice(0, 4);
    setSimilarJobs(similar);
  };

  useEffect(() => {
    if (similarJobs.length > similarJobsPerSlide) {
      const totalSlides = Math.ceil(similarJobs.length / similarJobsPerSlide);
      
      const interval = setInterval(() => {
        setSimilarCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [similarJobs.length, similarJobsPerSlide]);

  const similarTotalSlides = Math.ceil(similarJobs.length / similarJobsPerSlide);

  const goToSimilarSlide = (slideIndex) => {
    setSimilarCurrentSlide(slideIndex);
  };

  // Handle job application
  const applyHandler = async () => {
    try {
      console.log('=== Apply Handler Start ===');
      console.log('userData:', userData);
      console.log('jobData:', jobData);
      
      if (!userData) {
        return toast.error("Please login to apply.");
      }

      if (!userData.resume) {
        return toast.error("Please upload a resume before applying.");
      }

      const token = await getToken();
      
      if (!token) {
        return toast.error("Authentication failed. Please login again.");
      }

      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      
      try {
        if (token && token.includes('.')) {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', tokenPayload);
        }
      } catch (e) {
        console.log('Could not decode token (might not be JWT)');
      }

      const requestData = {
        jobId: jobData._id,
        companyId: jobData.companyId?._id || jobData.companyId
      };
      
      console.log('Request data:', requestData);
      console.log('Backend URL:', `${backendUrl}/api/users/apply`);
      console.log('Headers:', { Authorization: `Bearer ${token}` });

      const { data } = await axios.post(
        `${backendUrl}/api/users/apply`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('API Response:', data);

      if (data.success) {
        toast.success("Application submitted successfully!");
        if (typeof fetchUserApplications === 'function') {
          fetchUserApplications();
        }
        setAlreadyApplied(true);
      } else {
        console.log('API returned error:', data.message);
        toast.error(data.message || "Application failed");
      }
    } catch (error) {
      console.error('=== Application Error Details ===');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', error);
      
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please logout and login again.");
      } else if (error.response?.status === 400) {
        const errorMsg = error.response.data?.message || "Invalid request. Please try again.";
        console.error('400 Error details:', errorMsg);
        toast.error(errorMsg);
      } else if (error.response?.data?.message) {
        console.error('Server error message:', error.response.data.message);
        toast.error(error.response.data.message);
      } else if (error.message.includes('userId')) {
        console.error('userId error detected');
        toast.error("User authentication error. Please logout and login again.");
      } else {
        console.error('Unknown error');
        toast.error("Error applying for the job. Please try again.");
      }
    }
  };

  // Check if user already applied
  const checkAlreadyApplied = () => {
    try {
      if (jobData && userApplications && userApplications.length > 0) {
        const hasApplied = userApplications.some(
          (item) => {
            return item && item.jobId && item.jobId._id === jobData._id;
          }
        );
        setAlreadyApplied(hasApplied);
        console.log('Already applied check:', hasApplied);
      } else {
        console.log('Cannot check already applied:', {
          jobDataId: jobData?._id,
          userApplicationsType: typeof userApplications,
          userApplicationsLength: userApplications?.length
        });
      }
    } catch (error) {
      console.error('Error checking already applied:', error);
      setAlreadyApplied(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id, backendUrl]);

  useEffect(() => {
    checkAlreadyApplied();
  }, [jobData, userApplications]);

  useEffect(() => {
    console.log('=== AppContext Debug ===');
    console.log('jobs count:', jobs?.length);
    console.log('backendUrl:', backendUrl);
    console.log('userData:', userData);
    console.log('userData type:', typeof userData);
    console.log('userData keys:', userData ? Object.keys(userData) : 'null');
    console.log('userApplications:', userApplications);
    console.log('userApplications type:', typeof userApplications);
    console.log('userApplications length:', userApplications?.length);
    console.log('fetchUserApplications type:', typeof fetchUserApplications);
  }, [userData, userApplications, jobs, backendUrl]);

  useEffect(() => {
    const debugAuth = async () => {
      try {
        console.log('=== Clerk Auth Debug ===');
        const token = await getToken();
        console.log('Clerk token exists:', !!token);
        
        if (token) {
          console.log('Token first 50 chars:', token.substring(0, 50) + '...');
          
          try {
            if (token.includes('.')) {
              const parts = token.split('.');
              console.log('Token parts count:', parts.length);
              
              const header = JSON.parse(atob(parts[0]));
              const payload = JSON.parse(atob(parts[1]));
              
              console.log('JWT Header:', header);
              console.log('JWT Payload:', payload);
              console.log('Payload keys:', Object.keys(payload));
              
              console.log('Possible user IDs:');
              console.log('- payload.sub:', payload.sub);
              console.log('- payload.userId:', payload.userId);
              console.log('- payload.user_id:', payload.user_id);
              console.log('- payload.id:', payload.id);
            }
          } catch (decodeError) {
            console.log('Token is not a standard JWT:', decodeError.message);
          }
        }
      } catch (authError) {
        console.error('Clerk auth error:', authError);
      }
    };
    
    debugAuth();
  }, []);

  useEffect(() => {
    if (jobData) {
      console.log('=== Job Data Debug ===');
      console.log('jobData:', jobData);
      console.log('jobData._id:', jobData._id);
      console.log('jobData.companyId:', jobData.companyId);
      console.log('companyId type:', typeof jobData.companyId);
      
      if (jobData.companyId) {
        console.log('companyId._id:', jobData.companyId._id);
        console.log('companyId keys:', Object.keys(jobData.companyId));
      }
    }
  }, [jobData]);

  useEffect(() => {
    if (userApplications && userApplications.length > 0) {
      console.log('=== User Applications Debug ===');
      console.log('First application:', userApplications[0]);
      console.log('Application structure:');
      
      userApplications.forEach((app, index) => {
        console.log(`App ${index}:`, {
          hasUserId: app && 'userId' in app,
          hasJobId: app && 'jobId' in app,
          hasCompanyId: app && 'companyId' in app,
          jobId: app?.jobId,
          jobIdType: typeof app?.jobId,
          userId: app?.userId,
          userIdType: typeof app?.userId
        });
      });
    }
  }, [userApplications]);

  if (isLoading) {
    return <Loading />;
  }

  if (!jobData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#020330' }}>Job Not Found</h1>
            <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#FF0000' }}
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-screen bg-white">
          {/* Job Header Section */}
          <div className="py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start space-x-6">
                  {/* Fixed Company Logo with loading state */}
                  <CompanyLogo companyData={jobData?.companyId} />
                  
                  <div>
                    <h1 className="text-3xl font-bold text-white">{jobData?.title}</h1>
                    <p className="text-xl text-red-100 mt-1">{jobData?.companyId?.name}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center text-red-100">
                        <FiMapPin className="mr-2" />
                        {jobData?.location}
                      </div>
                      <div className="flex items-center text-red-100">
                        <FiBriefcase className="mr-2" />
                        {jobData?.level}
                      </div>
                      <div className="flex items-center text-red-100">
                        <FiBriefcase className="mr-2" />
                        {jobData?.noticeperiod}
                      </div>
                      <div className="flex items-center text-red-100">
                        <FiBriefcase className="mr-2" />
                        {jobData?.jobcategory}
                      </div>
                      <div className="flex items-center text-red-100">
                        <FiBriefcase className="mr-2" />
                        {jobData?.jobchannel}
                      </div>
                      <div className="flex items-center text-red-100">
                        <TbCurrencyRupee className="mr-2" />
                        {jobData?.salary ? kConvert.convertTo(jobData.salary) : "Competitive"}
                      </div>
                      <div className="flex items-center text-red-100">
                        <FiClock className="mr-2" />
                        Posted {moment(jobData?.date).fromNow()}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center"
                >
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all ${
                      isAlreadyApplied
                        ? "bg-green-600 text-white flex items-center"
                        : "bg-white hover:bg-gray-50 hover:shadow-xl"
                    }`}
                    style={!isAlreadyApplied ? { color: '#FF0000' } : {}}
                  >
                    {isAlreadyApplied ? (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Applied Successfully
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                  {!isAlreadyApplied && (
                    <p className="mt-2 text-red-100 text-sm">
                      {userData?.resume ? "Your resume is ready" : "Upload resume to apply"}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Job Details */}
              <div className="lg:w-2/3">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-md p-8 mb-8 border border-gray-200"
                >
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#020330' }}>Job Description</h2>
                  <div 
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: jobData?.description || "" }}
                  ></div>
                </motion.div>

                {/* Requirements */}
                {jobData?.requirements && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl shadow-md p-8 mb-8 border border-gray-200"
                  >
                    <h2 className="text-2xl font-bold mb-6" style={{ color: '#020330' }}>Requirements</h2>
                    <div 
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: jobData.requirements }}
                    ></div>
                  </motion.div>
                )}

                {/* Benefits */}
                {jobData?.benefits && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl shadow-md p-8 border border-gray-200"
                  >
                    <h2 className="text-2xl font-bold mb-6" style={{ color: '#020330' }}>Benefits</h2>
                    <div 
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: jobData.benefits }}
                    ></div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                {/* Company Info */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
                >
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#020330' }}>About {jobData?.companyId?.name}</h3>
                  <p className="text-gray-600 mb-4">
                    {jobData?.companyId?.description || "Leading company in their industry."}
                  </p>
                  <a 
                    href={`/company/${jobData?.companyId?._id}`}
                    className="font-medium flex items-center hover:opacity-80 transition-opacity"
                    style={{ color: '#FF0000' }}
                  >
                    View company profile <FiExternalLink className="ml-1" />
                  </a>
                </motion.div>

                {/* Similar Jobs */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
                >
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#020330' }}>Similar Jobs</h3>
                  
                  {similarJobs.length > 0 ? (
                    <div className="space-y-4">
                      {/* Slider Container */}
                      <div className="overflow-hidden">
                        <motion.div
                          className="flex transition-transform duration-500 ease-in-out"
                          style={{
                            transform: `translateX(-${similarCurrentSlide * 100}%)`
                          }}
                        >
                          {Array.from({ length: similarTotalSlides }, (_, slideIndex) => (
                            <div
                              key={slideIndex}
                              className="w-full flex-shrink-0"
                            >
                              <div className="space-y-4">
                                {similarJobs
                                  .slice(slideIndex * similarJobsPerSlide, (slideIndex + 1) * similarJobsPerSlide)
                                  .map((job) => (
                                    <JobCard key={job._id} job={job} compact />
                                  ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      </div>

                      {/* Dot Indicators */}
                      {similarTotalSlides > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                          {Array.from({ length: similarTotalSlides }, (_, index) => (
                            <button
                              key={index}
                              onClick={() => goToSimilarSlide(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                similarCurrentSlide === index
                                  ? 'bg-red-500 scale-110'
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                              aria-label={`Go to similar jobs slide ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No similar jobs found</p>
                  )}
                </motion.div>

                {/* Quick Apply */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-red-50 border border-red-100 rounded-xl p-6"
                >
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#020330' }}>Ready to apply?</h3>
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`w-full px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-all ${
                      isAlreadyApplied
                        ? "bg-green-600 text-white flex items-center justify-center"
                        : "text-white hover:opacity-90 hover:shadow-lg"
                    }`}
                    style={!isAlreadyApplied ? { backgroundColor: '#FF0000' } : {}}
                  >
                    {isAlreadyApplied ? (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Application Submitted
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                  {!userData?.resume && !isAlreadyApplied && (
                    <p className="mt-3 text-sm" style={{ color: '#FF0000' }}>
                      Don't forget to upload your resume first
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <Calltoaction />
        <Footer />
      </motion.div>
    </>
  );
};

export default ApplyJob;