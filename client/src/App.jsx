import React, { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useUser, useClerk } from '@clerk/clerk-react';
import { toast } from "react-toastify";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import ApplyJob from "./pages/ApplyJob";
import JobListing from "./pages/JobListing";
import JobCategories from "./components/JobCategories";
import JobAlert from "./pages/Jobalert"
import RecruiterLogin from "./components/RecruiterLogin";
import { AppContext } from "./context/AppContext";
import Dashboard from "./pages/Dashboard";
import AddJob from "./pages/AddJob";
import EmployerProfile from "./pages/EmployerProfile";
import ManageJobs from "./pages/ManageJobs";
import ViewApplications from "./pages/ViewApplications";
import ManagePackage from "./pages/ManagePackage";
import MyProfile from "./components/MyProfile";
import AppliedJobs from "./components/AppliedJobs";
import BulkUpload from './pages/BulkUpload';
import SearchResume from './pages/SearchResume';
import JobAlerts from "./components/JobAlerts";
import MainDashboard from "./pages/Maindashboard";
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PublicCompanyProfile from './pages/PublicCompanyProfile';
import MyTeam from "./pages/MyTeam";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import VisionMission from "./pages/VisionMission";

// ✅ FIXED: Route Protection Component for Main Recruiter Only
const ProtectFromSubUsers = ({ children }) => {
  const { companyData } = useContext(AppContext);
  
  // Check if user is a sub-user
  if (companyData?.isSubUser) {
    toast.error(`${companyData.roleType?.toUpperCase() || 'Sub-user'} users can only access Applications page`);
    return <Navigate to="/dashboard/view-applications" replace />;
  }
  
  return children;
};

// ✅ FIXED: Permission-Based Route Protection for Sub-Users
const PermissionProtectedRoute = ({ children, permission }) => {
  const { companyData } = useContext(AppContext);
  
  // Main recruiter always has all permissions
  if (!companyData?.isSubUser) {
    return children;
  }
  
  // Check if sub-user has the required permission
  const hasPermission = companyData?.permissions?.[permission];
  
  if (!hasPermission) {
    const permissionNames = {
      canPostJobs: 'Post Jobs',
      canManageBulkUpload: 'Bulk Upload & Search Resume'
    };
    
    toast.error(`${companyData.roleType?.toUpperCase() || 'Sub-user'} users need "${permissionNames[permission]}" permission. Contact your admin.`);
    return <Navigate to="/dashboard/view-applications" replace />;
  }
  
  return children;
};

// Demo-Friendly Protected Route Component
const DemoFriendlyRecruiterRoute = ({ children, requireAuth = false }) => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { companyToken } = useContext(AppContext);
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }
  
  const isLoggedInRecruiter = !!companyToken || (user && (
    user.publicMetadata?.role === 'recruiter' || 
    user.publicMetadata?.accountType === 'company' || 
    user.publicMetadata?.lastLoginType === 'recruiter'
  ));
  
  if (requireAuth && !isLoggedInRecruiter) {
    toast.error("Please login to access this feature");
    window.location.href = '/';
    return null;
  }
  
  return children;
};

const App = () => {
  const { showRecruiterLogin, companyToken } = useContext(AppContext);

  return (
    <div>
      {showRecruiterLogin && <RecruiterLogin />}
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/apply-job/:id" element={<ApplyJob />} />
        <Route path="/job/:id" element={<ApplyJob />} />
        <Route path="/JobAlert" element={<JobAlert />} />
        <Route path="/recruiter-login" element={<RecruiterLogin />} />
        <Route path="/applications" element={<Applications />}>
          <Route path="my-profile" element={<MyProfile />} />
          <Route path="applied-jobs" element={<AppliedJobs />} />
          <Route path="job-alerts" element={<JobAlerts />} />
        </Route>
        <Route path="/JobCategories" element={<JobCategories />} />
        <Route path="/JobListing" element={<JobListing />} />
        <Route path="/company/:id" element={<PublicCompanyProfile />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/vision-mission" element={<VisionMission />} />

        {/* DASHBOARD ROUTES - With Sub-User Protection */}
        <Route 
          path="/dashboard" 
          element={
            <DemoFriendlyRecruiterRoute>
              <Dashboard />
            </DemoFriendlyRecruiterRoute>
          }
        >
          {/* ✅ OPEN TO ALL: Applications (sub-users and main recruiters) */}
          <Route 
            path="view-applications" 
            element={
              <DemoFriendlyRecruiterRoute>
                <ViewApplications />
              </DemoFriendlyRecruiterRoute>
            } 
          />

          {/* ✅ NEW: Main Dashboard - Analytics Dashboard */}
          <Route 
            path="main-dashboard" 
            element={
              <DemoFriendlyRecruiterRoute>
                <ProtectFromSubUsers>
                  <MainDashboard />
                </ProtectFromSubUsers>
              </DemoFriendlyRecruiterRoute>
            } 
          />

          {/* ✅ MAIN RECRUITER ONLY: My Team */}
          <Route 
            path="my-team" 
            element={
              <DemoFriendlyRecruiterRoute>
                <ProtectFromSubUsers>
                  <MyTeam />
                </ProtectFromSubUsers>
              </DemoFriendlyRecruiterRoute>
            } 
          />

          {/* ✅ FIXED: Add Job - Permission-based (canPostJobs) */}
          <Route 
            path="add-job" 
            element={
              <DemoFriendlyRecruiterRoute>
                <PermissionProtectedRoute permission="canPostJobs">
                  <AddJob />
                </PermissionProtectedRoute>
              </DemoFriendlyRecruiterRoute>
            } 
          />
          
          {/* ✅ FIXED: Manage Jobs - Permission-based (canPostJobs) */}
          <Route 
            path="manage-job" 
            element={
              <DemoFriendlyRecruiterRoute>
                <PermissionProtectedRoute permission="canPostJobs">
                  <ManageJobs />
                </PermissionProtectedRoute>
              </DemoFriendlyRecruiterRoute>
            } 
          />

          {/* ✅ FIXED: Bulk Upload - Permission-based (canManageBulkUpload) */}
          <Route 
            path="bulk-upload" 
            element={
              <DemoFriendlyRecruiterRoute>
                <PermissionProtectedRoute permission="canManageBulkUpload">
                  <BulkUpload />
                </PermissionProtectedRoute>
              </DemoFriendlyRecruiterRoute>
            } 
          />

          {/* ✅ FIXED: Search Resume - Permission-based (canManageBulkUpload) */}
          <Route 
            path="search-resume" 
            element={
              <DemoFriendlyRecruiterRoute>
                <PermissionProtectedRoute permission="canManageBulkUpload">
                  <SearchResume />
                </PermissionProtectedRoute>
              </DemoFriendlyRecruiterRoute>
            } 
          />
          
          {/* ✅ MAIN RECRUITER ONLY: Profile */}
          <Route 
            path="profile" 
            element={
              <DemoFriendlyRecruiterRoute>
                <ProtectFromSubUsers>
                  <EmployerProfile />
                </ProtectFromSubUsers>
              </DemoFriendlyRecruiterRoute>
            } 
          />
          
          {/* ✅ MAIN RECRUITER ONLY: Manage Package */}
          <Route 
            path="manage-package" 
            element={
              <DemoFriendlyRecruiterRoute>
                <ProtectFromSubUsers>
                  <ManagePackage />
                </ProtectFromSubUsers>
              </DemoFriendlyRecruiterRoute>
            } 
          />
        </Route>
      </Routes>
    </div>
  );
};

export default App;