import React, { useContext, useEffect, useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Zap, Menu, X, User } from "lucide-react";
import DEEmploymintIcon from "../assets/DEEmploymintIcon.png";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { setShowRecruiterLogin, companyToken, userData } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // Calculate if profile is incomplete
  const calculateCompletion = () => {
    if (!userData) return { isComplete: true };
    
    const personalFields = [
      userData.firstName,
      userData.surname,
      userData.mobileNo,
      userData.emailId,
      userData.city,
      userData.state,
      userData.languages,
      userData.maritalStatus,
      userData.instagramId,
      userData.facebookId
    ];
    
    const professionalFields = [
      userData.currentDesignation,
      userData.currentDepartment,
      userData.currentCTC,
      userData.expectedCTC,
      userData.noticePeriod,
      userData.totalExperience,
      userData.jobChangeStatus,
      userData.sector === 'Other' ? userData.otherSector : userData.sector,
      userData.category === 'Other' ? userData.otherCategory : userData.category
    ];
    
    const hasResume = userData.resume && 
                     typeof userData.resume === 'string' && 
                     userData.resume.trim() !== '' && 
                     userData.resume !== 'undefined' &&
                     userData.resume !== 'null';
    
    const personalFilled = personalFields.filter(f => f && f.trim() !== '').length;
    const professionalFilled = professionalFields.filter(f => f && f.toString().trim() !== '').length;
    
    const personalComplete = (personalFilled / personalFields.length) * 100 === 100;
    const professionalComplete = (professionalFilled / professionalFields.length) * 100 === 100;
    
    return {
      isComplete: personalComplete && professionalComplete && hasResume
    };
  };

  const { isComplete: isProfileComplete } = calculateCompletion();

  // Show popup ONLY ONCE per session when user logs in and profile is incomplete
  useEffect(() => {
    // Check if popup has already been shown in this session
    const hasShownPopup = sessionStorage.getItem('profilePopupShown');
    
    if (user && userData && !isProfileComplete && !hasShownPopup) {
      // Mark as shown in sessionStorage (clears when browser tab closes)
      sessionStorage.setItem('profilePopupShown', 'true');
      
      setShowProfilePopup(true);
      const timer = setTimeout(() => {
        setShowProfilePopup(false);
      }, 17000); // Auto-hide after 17 seconds
      
      return () => clearTimeout(timer);
    }
  }, [user, userData, isProfileComplete]);

  // Clear the popup flag when user completes profile
  useEffect(() => {
    if (isProfileComplete) {
      sessionStorage.removeItem('profilePopupShown');
    }
  }, [isProfileComplete]);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const handleRecruiterClick = () => {
    setMobileMenuOpen(false);
    if (companyToken) {
      navigate("/dashboard");
    } else {
      setShowRecruiterLogin?.(true);
    }
  };

  // Helper function to check if a path is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // Navigation items with their paths
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/JobCategories", label: "Job Categories" },
    { path: "/JobListing", label: "Latest Jobs" },
    { path: "/contact", label: "Contact Us" },
  ];

  return (
    <>
      {/* Spacer div to prevent content jump when navbar becomes fixed */}
      <div className="h-2"></div>

      <div
        className={`${
          scrolled ? "fixed animate-slideDown" : "relative"
        } top-0 left-0 right-0 z-20 w-full transition-all duration-300`}
      >
        <nav
          className={`transition-all duration-500 ${
            scrolled
              ? "mx-2 sm:mx-4 my-3 max-w-6xl md:mx-auto bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 py-3 sm:py-4 px-4 sm:px-6"
              : "mx-4 sm:mx-8 rounded-xl bg-white shadow-lg border-b border-gray-100 py-4 sm:py-6 px-4 sm:px-8"
          } flex justify-between items-center min-h-[60px]`}
          style={{
            boxShadow: scrolled 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)" 
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05)"
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
            onClick={() => navigate("/")}
          >
            <div
              className={`p-1.5 sm:p-2 rounded-lg ${
                scrolled ? "shadow-lg" : ""
              } group-hover:shadow-red-500/30 transition-all duration-300`}
            >
              <img
                src={DEEmploymintIcon}
                alt="DEEmploymint"
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain"
              />
            </div>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold whitespace-nowrap" style={{ color: "#020330" }}>
              DE Employmint
            </span>
          </div>

          {/* Desktop Navigation - Hidden on mobile/tablet (< 1024px) */}
          <div className="hidden lg:flex items-center flex-1 justify-center mx-4">
            <div className="flex items-center gap-6 xl:gap-8 text-gray-700 font-medium">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-300 relative ${
                    isActiveLink(item.path)
                      ? "text-red-600 bg-red-50 shadow-sm"
                      : "hover:text-red-600 hover:bg-red-50/50"
                  }`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span className="relative whitespace-nowrap text-sm xl:text-base">
                    {item.label}
                    {isActiveLink(item.path) && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full animate-pulse"></span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Right Section - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-3 relative">
                <span className="hidden xl:block text-sm text-gray-600">
                  Hi, {user.firstName}
                </span>
                
                {/* Profile Completion Popup */}
                <div className="relative">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "h-10 w-10 border-2 shadow-md",
                        userButtonPopoverCard: "shadow-2xl rounded-xl border border-gray-100",
                        userButtonTrigger: "focus:ring-2",
                        userButtonPopoverActionButton: "hover:bg-red-50",
                        userButtonPopoverActionButtonIcon: "text-gray-600",
                        userButtonPopoverActionButtonText: "text-gray-700 font-medium"
                      },
                      variables: {
                        borderRadius: "0.75rem",
                      },
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Your Profile"
                        labelIcon={<User size={16} />}
                        onClick={() => navigate('/applications')}
                      />
                      <UserButton.Action label="manageAccount" />
                    </UserButton.MenuItems>
                  </UserButton>
                  
                  {/* Animated Popup - DESKTOP */}
                  <AnimatePresence>
                    {showProfilePopup && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-3 w-80 z-50"
                        onClick={() => {
                          navigate('/applications');
                          setShowProfilePopup(false);
                        }}
                      >
                        <div className="bg-white rounded-2xl p-5 shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] relative">
                          <div className="flex items-start gap-4">
                            {/* Cute hand wave emoji - no background */}
                            <span className="text-5xl flex-shrink-0 animate-wave">👋</span>
                            
                            <div className="flex-1 pt-2">
                              <p className="text-lg font-bold text-gray-900 leading-snug mb-1.5">
                                Hey there!
                              </p>
                              <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                Complete your profile to shine bright and get noticed by recruiters! ✨
                              </p>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowProfilePopup(false);
                              }}
                              className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 hover:rotate-90 duration-300"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute -top-2 right-8 w-4 h-4 bg-white border-l-2 border-t-2 border-gray-200 transform rotate-45 shadow-sm"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleRecruiterClick}
                  className={`text-sm font-medium transition-all duration-300 px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg whitespace-nowrap transform hover:scale-105 ${
                    companyToken
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "text-white"
                  }`}
                  style={!companyToken ? { backgroundColor: "#FF0000" } : {}}
                >
                  {companyToken ? "Recruiter Dashboard" : "Post Job for Free"}
                </button>
                <button
                  onClick={() => openSignIn()}
                  className="text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{ backgroundColor: "#FF0000" }}
                >
                  Job Seeker
                </button>
              </>
            )}
          </div>

          {/* Mobile/Tablet Hamburger Menu - Visible below 1024px */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <div className="relative">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-9 w-9 border-2 shadow-md",
                      userButtonPopoverCard: "shadow-2xl rounded-xl border border-gray-100",
                      userButtonPopoverActionButton: "hover:bg-red-50",
                      userButtonPopoverActionButtonIcon: "text-gray-600",
                      userButtonPopoverActionButtonText: "text-gray-700 font-medium"
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="Your Profile"
                      labelIcon={<User size={16} />}
                      onClick={() => navigate('/applications')}
                    />
                    <UserButton.Action label="manageAccount" />
                  </UserButton.MenuItems>
                </UserButton>
                
                {/* Mobile Popup */}
                <AnimatePresence>
                  {showProfilePopup && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-3 w-72 z-50"
                      onClick={() => {
                        navigate('/applications');
                        setShowProfilePopup(false);
                      }}
                    >
                      <div className="bg-white rounded-2xl p-4 shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-300 relative">
                        <div className="flex items-start gap-3">
                          {/* Cute hand wave emoji - no background */}
                          <span className="text-4xl flex-shrink-0 animate-wave">👋</span>
                          
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-bold text-gray-900 leading-snug mb-1">
                              Hey there!
                            </p>
                            <p className="text-xs font-medium text-gray-700 leading-relaxed">
                              Complete your profile to get noticed by recruiters! ✨
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowProfilePopup(false);
                            }}
                            className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 hover:rotate-90 duration-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l-2 border-t-2 border-gray-200 transform rotate-45 shadow-sm"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-0 z-50 mobile-menu-container lg:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Menu Content */}
            <div className="relative bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-100 mx-2 sm:mx-4 mt-3 rounded-2xl overflow-hidden max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img 
                    src={DEEmploymintIcon} 
                    alt="DEEmploymint" 
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-lg font-bold" style={{ color: "#020330" }}>
                    DE Employmint
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
                  aria-label="Close mobile menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActiveLink(item.path)
                        ? "text-white bg-red-500 shadow-md"
                        : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    {item.icon && item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* User Section */}
              <div className="border-t border-gray-100 p-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserButton
                          appearance={{
                            elements: {
                              userButtonAvatarBox: "h-12 w-12 border-2 shadow-md",
                              userButtonPopoverCard: "shadow-2xl rounded-xl border border-gray-100",
                            },
                          }}
                        >
                          <UserButton.MenuItems>
                            <UserButton.Action
                              label="Your Profile"
                              labelIcon={<User size={16} />}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                navigate('/applications');
                              }}
                            />
                            <UserButton.Action label="manageAccount" />
                          </UserButton.MenuItems>
                        </UserButton>
                        <div>
                          <p className="font-medium text-gray-800">Hi, {user.firstName}!</p>
                          <p className="text-sm text-gray-500">Job Seeker</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Profile Link Button */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/applications');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <User size={18} />
                      Go to Your Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleRecruiterClick}
                      className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        companyToken 
                          ? "bg-green-500 text-white hover:bg-green-600 shadow-md" 
                          : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                      }`}
                    >
                      {companyToken ? "Recruiter Dashboard" : "Post Job for Free"}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openSignIn();
                      }}
                      className="w-full px-4 py-3 rounded-xl font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
                      style={{ backgroundColor: "#FF0000" }}
                    >
                      Job Seeker
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
    </>
  );
};

export default Navbar;