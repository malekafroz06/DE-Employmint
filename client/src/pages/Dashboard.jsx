// Updated Dashboard with Permission-Based Access Control
import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DEEmploymintIcon from "../assets/DELogo.png";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlusCircle, FiFolder, FiMail, FiUser, FiHome, FiUpload, FiAlertCircle, FiPackage, FiMenu, FiX, FiUsers, FiSearch, FiLogOut, FiChevronRight } from "react-icons/fi";
import { toast } from "react-toastify";

// ✅ FIXED: Helper function now accepts permissions parameter
const getNavItems = (isSubUser, subUserRole, permissions) => {
  // ✅ Sub-users see menu items based on their permissions
  if (isSubUser) {
    const subUserItems = [
      { path: "view-applications", label: "Applications", icon: <FiMail /> },
    ];
    
    // Add permission-based items
    if (permissions?.canPostJobs) {
      subUserItems.push({ path: "add-job", label: "Post New Job", icon: <FiPlusCircle /> });
    }
    
    if (permissions?.canManageBulkUpload) {
      subUserItems.push({ path: "bulk-upload", label: "Resume Parse", icon: <FiUpload /> });
      subUserItems.push({ path: "search-resume", label: "Candidate Profile", icon: <FiSearch /> });
    }
    
    return subUserItems;
  }
  
  // ✅ Main recruiters see everything
  const baseItems = [
    { path: "profile", label: "Company Profile", icon: <FiUser /> },
    { path: "manage-job", label: "Manage Jobs", icon: <FiFolder /> },
    { path: "view-applications", label: "Applications", icon: <FiMail /> },
    { path: "add-job", label: "Post New Job", icon: <FiPlusCircle /> },
    { path: "bulk-upload", label: "Resume Parse", icon: <FiUpload /> },
    { path: "search-resume", label: "Candidate Profile", icon: <FiSearch /> },
    //{ path: "manage-package", label: "Manage Package", icon: <FiPackage /> },
    //{ path: "my-team", label: "My Team", icon: <FiUsers /> },
    //{ path: "main-dashboard", label: "Dashboard", icon: <FiUsers /> },

  ];
  
  return baseItems;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { companyData, setCompanyData, setCompanyToken, companyToken, setShowRecruiterLogin } = useContext(AppContext);
  const [hasInitiallyOpened, setHasInitiallyOpened] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = !!companyToken && !!companyData;
  
  // ✅ Check if sub-user and get permissions
  const isSubUser = companyData?.isSubUser || false;
  const subUserRole = companyData?.roleType || '';
  const permissions = companyData?.permissions || {};
  
  // ✅ FIXED: Pass permissions to getNavItems
  const navItems = getNavItems(isSubUser, subUserRole, permissions);

  // ✅ Updated redirect logic - check permissions for sub-users
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      if (isSubUser) {
        // Always go to applications for sub-users
        navigate("/dashboard/view-applications");
      } else {
        navigate("/dashboard/manage-job");
      }
    }
  }, [location.pathname, navigate, isSubUser]);

  // ✅ FIXED: Block unauthorized routes but allow permitted routes
  useEffect(() => {
    if (isSubUser && location.pathname !== '/dashboard') {
      const currentPath = location.pathname.split('/').pop();
      
      // Check if current path is in their allowed nav items
      const hasAccess = navItems.some(item => item.path === currentPath);
      
      if (!hasAccess) {
        toast.error(`${subUserRole.toUpperCase()} users don't have permission to access this page`);
        navigate("/dashboard/view-applications");
      }
    }
  }, [location.pathname, isSubUser, subUserRole, navigate, navItems]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (!hasInitiallyOpened) {
        if (mobile) {
          setIsSidebarOpen(true);
        } else {
          setIsSidebarOpen(true);
        }
        setHasInitiallyOpened(true);
      } else {
        if (!mobile) {
          setIsSidebarOpen(true);
        }
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasInitiallyOpened]); 

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isSidebarOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.sidebar-toggle')) {
        setIsSidebarOpen(false);
      }
    };
     document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);


  const logout = () => {
    if (!isLoggedIn) {
      setShowRecruiterLogin(true);
      return;
    }
    setCompanyToken(null);
    localStorage.removeItem("companyToken");
    setCompanyData(null);
    navigate("/");
  };

  const handleProfileClick = () => {
    // ✅ Sub-users cannot access profile
    if (isSubUser) {
      toast.error(`${subUserRole.toUpperCase()} users cannot access Company Profile`);
      return;
    }
    
    if (!isLoggedIn) {
      showLoginNotification();
      return;
    }
    navigate("/dashboard/profile");
    if (isMobile) setIsSidebarOpen(false);
  };

  const showLoginNotification = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-[#f3f4f7] font-[Poppins] relative">
      {/* Login Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-[100] bg-red-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span className="text-sm">Please login as recruiter first!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`sidebar-container ${
              isMobile
                ? "fixed left-0 top-0 z-50"
                : "relative"
            } w-64 sm:w-72 h-full bg-white flex flex-col justify-between border-r border-gray-200 shadow-xl`}
          >
            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 lg:hidden z-10"
              >
                <FiX size={20} />
              </button>
            )}

            <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
              {/* Brand */}
              <div
                className="flex items-center gap-1 mb-5 sm:mb-6 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <img
                  src={DEEmploymintIcon}
                  alt="Logo"
                  className="h-14 sm:h-16 w-auto object-contain flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-gray-900 font-bold text-sm sm:text-base leading-tight truncate">Employmint</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 tracking-wide truncate">BFSI Talent Pipeline</p>
                </div>
              </div>

              <motion.button
                onClick={() => {
                  navigate('/');
                  if (isMobile) setIsSidebarOpen(false);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-3 bg-gray-50 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-all duration-200 mb-5 sm:mb-6"
              >
                <FiHome className="text-base sm:text-lg flex-shrink-0" />
                <span className="text-sm sm:text-base">Back to Home</span>
              </motion.button>

              <p className="px-2 mb-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Menu
              </p>

              <div className="space-y-1 sm:space-y-1.5">
                {navItems.map(({ path, label, icon }, i) => (
                  <NavLink
                    key={i}
                    to={`/dashboard/${path}`}
                    onClick={(e) => {
                      if (isMobile) setIsSidebarOpen(false);

                      if (!isLoggedIn) {
                        setTimeout(() => showLoginNotification(), 100);
                      }
                    }}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                        isActive
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } ${!isLoggedIn ? 'opacity-70' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-lg text-base flex-shrink-0 transition-colors duration-200 ${
                            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:text-gray-800"
                          }`}
                        >
                          {icon}
                        </span>
                        <span className="text-sm sm:text-[15px] truncate">{label}</span>
                        {isActive && <FiChevronRight className="ml-auto text-white/80 flex-shrink-0" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 sm:p-5">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-all duration-200"
                onClick={handleProfileClick}
              >
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md flex-shrink-0 bg-gradient-to-br from-red-500 to-red-600"
                >
                  {isLoggedIn ? (companyData?.name?.[0] || "C") : "D"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate text-gray-900">
                      {isLoggedIn ? companyData?.name : "Demo Company"}
                    </p>
                    {/* ✅ Sub-user role badge */}
                    {isLoggedIn && isSubUser && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 uppercase">
                        {subUserRole}
                      </span>
                    )}
                  </div>

                  <p className="text-xs truncate text-gray-500">
                    {isLoggedIn ? (
                      isSubUser ? `${subUserRole.toUpperCase()} Access` : "Recruiter Mode"
                    ) : "Demo Mode"}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:text-red-700 w-full py-2 rounded-xl transition-all duration-200"
              >
                <FiLogOut size={15} />
                {isLoggedIn ? "Sign out" : "Login Required"}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile-only bar — just the sidebar toggle, since the sidebar is the only
            way to navigate on small screens and closes itself after each tap. */}
        <div className="lg:hidden flex items-center px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="sidebar-toggle p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            <FiMenu size={20} />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 min-h-[500px] relative"
          >
            <Outlet context={{ isLoggedIn, showLoginNotification, setShowRecruiterLogin, isSubUser, subUserRole }} />

            {!isLoggedIn && (
              <div
                className="absolute inset-0 bg-transparent pointer-events-auto cursor-pointer rounded-2xl sm:rounded-3xl"
                onClick={showLoginNotification}
                style={{zIndex: 1}}
              />
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;