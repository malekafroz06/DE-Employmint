// Responsive Candidate Dashboard Component - Always open sidebar on entry
import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DEEmploymintIcon from "../assets/DELogoTransparent.png";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiBriefcase, FiBell, FiHome, FiMenu, FiX } from "react-icons/fi";
import { useClerk } from "@clerk/clerk-react";

const Applications = () => {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const { userData, setUserData, userToken, setUserToken } = useContext(AppContext);
const [hasInitiallyOpened, setHasInitiallyOpened] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    setActiveTab(path);
  }, [location]);

  useEffect(() => {
    if (userData) navigate("/applications/my-profile");
  }, [userData]);

  // Responsive handling - Always open sidebar on mobile when entering applications
  useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
    
    // Only auto-open sidebar on initial load, not on every resize
    if (!hasInitiallyOpened) {
      if (mobile) {
        // Show sidebar initially on mobile so users see all features
        setIsSidebarOpen(true);
      } else {
        // Always open on desktop
        setIsSidebarOpen(true);
      }
      setHasInitiallyOpened(true);
    } else {
      // On subsequent resizes, keep desktop sidebar open
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    }
  };
  
  // Initial check
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
    signOut().then(() => {
      setUserToken(null);
      localStorage.removeItem("userToken");
      setUserData(null);
      navigate("/");
    }).catch((error) => {
      console.error("Sign out error:", error);
      navigate("/");
    });
  };

  const handleProfileClick = () => {
    navigate("/applications/my-profile");
    if (isMobile) setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Candidate Dashboard Navigation Items
  const navItems = [
    { path: "my-profile", label: "My Profile", icon: <FiUser /> },
    { path: "applied-jobs", label: "Applied Jobs", icon: <FiBriefcase /> },
    { path: "job-alerts", label: "Job Alerts", icon: <FiBell /> },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-tr from-[#f5f7fa] via-[#ebedfb] to-[#dce3ff] font-[Poppins] relative">
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
              <div
                className="flex items-center gap-2.5 mb-6 sm:mb-8 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <img
                  src={DEEmploymintIcon}
                  alt="Logo"
                  className="h-8 sm:h-9 w-auto object-contain flex-shrink-0"
                />
                <p className="text-gray-900 font-bold text-sm sm:text-base leading-tight truncate">DE employmint</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {/* Home Button - Above other nav items */}
                <motion.button
                  onClick={() => {
                    navigate('/');
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-3 bg-gray-200 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800 transition-all duration-200 shadow-lg hover:scale-[1.02] mb-4"
                >
                  <FiHome className="text-base sm:text-lg flex-shrink-0" />
                  <span className="text-sm sm:text-base">Home</span>
                </motion.button>

                {navItems.map(({ path, label, icon }, i) => (
                  <NavLink
                    key={i}
                    to={`/applications/${path}`}
                    onClick={() => {
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm font-medium hover:scale-[1.02] ${
                        isActive
                          ? "text-white"
                          : "text-gray-800 hover:bg-white/20"
                      }`
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
                {/* Circle with lighter red background */}
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-bold shadow-md flex-shrink-0"
                  style={{ backgroundColor: '#ff6666' }}
                >
                  {userData?.name?.[0] || "U"}
                </div>

                {/* Text with custom red shades */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: '#022030' }}>
                    {userData?.name}
                  </p>
                  <p className="text-xs" style={{ color: '#022030' }}>
                    Candidate Mode
                  </p> 
                </div>
              </div>

              {/* Logout button stays red */}
              <button
                onClick={logout}
                className="mt-3 sm:mt-4 text-sm text-red-500 hover:underline w-full text-left"
              >
                Sign out
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
          {/* Left side - Menu button and title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle p-2 text-gray-600 hover:text-gray-800 lg:hidden flex-shrink-0"
            >
              <FiMenu size={20} />
            </button>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                {activeTab.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Dashboard"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Right side - Greeting */}
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-sm text-gray-600 font-semibold">{getGreeting()},</p>
            <p className="text-xs text-gray-500">{userData?.name}</p>
            <p className="text-sm text-gray-400">{formatTime(currentTime)}</p>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 min-h-[500px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Applications;