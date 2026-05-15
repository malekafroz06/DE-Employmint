// Updated Dashboard with Permission-Based Access Control
import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DEEmploymintIcon from "../assets/DEEmploymintIcon.png";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlusCircle, FiFolder, FiMail, FiUser, FiHome, FiUpload, FiAlertCircle, FiPackage, FiMenu, FiX, FiUsers, FiSearch } from "react-icons/fi";
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
      subUserItems.push({ path: "bulk-upload", label: "Bulk Upload", icon: <FiUpload /> });
      subUserItems.push({ path: "search-resume", label: "Search Resume", icon: <FiSearch /> });
    }
    
    return subUserItems;
  }
  
  // ✅ Main recruiters see everything
  const baseItems = [
    { path: "profile", label: "Company Profile", icon: <FiUser /> },
    { path: "manage-job", label: "Manage Jobs", icon: <FiFolder /> },
    { path: "view-applications", label: "Applications", icon: <FiMail /> },
    { path: "add-job", label: "Post New Job", icon: <FiPlusCircle /> },
    { path: "bulk-upload", label: "Bulk Upload", icon: <FiUpload /> },
    { path: "search-resume", label: "Search Resume", icon: <FiSearch /> },
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("");
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    setActiveTab(path);
  }, [location]);

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

  const formatTime = date => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  };

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
    <div className="flex h-screen bg-gradient-to-tr from-[#f5f7fa] via-[#ebedfb] to-[#dce3ff] font-[Poppins] relative">
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
            } w-64 sm:w-72 h-full bg-white/60 backdrop-blur-md flex flex-col justify-between border-r border-white/30`}
          >
            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-800 lg:hidden z-10"
              >
                <FiX size={20} />
              </button>
            )}

            <div className="p-4 sm:p-6">
              <img 
                src={DEEmploymintIcon} 
                alt="Logo" 
                className="h-12 sm:h-16 mb-6 sm:mb-8 cursor-pointer" 
                onClick={() => navigate("/")} 
              />
                            
              <motion.button
                onClick={() => {
                  navigate('/');
                  if (isMobile) setIsSidebarOpen(false);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-3 bg-gray-200 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800 transition-all duration-200 shadow-lg hover:scale-[1.02]"
                style={{ marginBottom: "16px" }}
              >
                <FiHome className="text-base sm:text-lg flex-shrink-0" />
                <span className="text-sm sm:text-base">Home</span>
              </motion.button>

              <div className="space-y-2 sm:space-y-3">
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
                      `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm font-medium hover:scale-[1.02] ${
                        isActive
                          ? "text-white"
                          : "text-gray-800 hover:bg-white/20"
                      } ${!isLoggedIn ? 'opacity-70' : ''}`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#ff0000" : "transparent"
                    })}
                  >
                    <span className="text-base sm:text-lg flex-shrink-0">{icon}</span>
                    <span className="text-sm sm:text-base">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm p-4 sm:p-5 rounded-bl-3xl">
              <div 
                className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                onClick={handleProfileClick}
              >
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-bold shadow-md flex-shrink-0"
                  style={{ backgroundColor: '#ff6666' }}
                >
                  {isLoggedIn ? (companyData?.name?.[0] || "C") : "D"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#022030' }}>
                      {isLoggedIn ? companyData?.name : "Demo Company"}
                    </p>
                    {/* ✅ Sub-user role badge */}
                    {isLoggedIn && isSubUser && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 uppercase">
                        {subUserRole}
                      </span>
                    )}
                  </div>
                   
                  <p className="text-xs truncate" style={{ color: '#022030' }}>
                    {isLoggedIn ? (
                      isSubUser ? `${subUserRole.toUpperCase()} Access` : "Recruiter Mode"
                    ) : "Demo Mode"}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="mt-3 sm:mt-4 text-sm text-red-500 hover:underline w-full text-left"
              >
                {isLoggedIn ? "Sign out" : "Login Required"}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/70 backdrop-blur-md shadow px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center border-b border-white/20"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle p-2 text-gray-600 hover:text-gray-800 lg:hidden flex-shrink-0"
            >
              <FiMenu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  {activeTab.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Dashboard"}
                </h1>
                {!isLoggedIn && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded flex-shrink-0">
                    Demo Mode
                  </span>
                )}
                {/* ✅ Show sub-user role badge in header */}
                {isLoggedIn && isSubUser && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex-shrink-0 font-medium uppercase">
                    {subUserRole}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                
              </p>
            </div>
        </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-sm text-gray-600 font-semibold">{getGreeting()},</p>
            <p className="text-xs text-gray-500">{isLoggedIn ? companyData?.name : "Demo User"}</p>
            <p className="text-sm text-gray-400">{formatTime(currentTime)}</p>
          </div>
        </motion.header>
          
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 min-h-[500px] relative"
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