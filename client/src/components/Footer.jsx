import React, { useState } from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail("");
    }
  };

  const scrollToTop = () => window.scrollTo(0, 0);

  return (
    <footer className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20 bg-white">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-red-600 opacity-5 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ backgroundColor: "#FF0000" }}></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Newsletter Section */}
        <div className="mb-10 sm:mb-14 lg:mb-16">
          <div className="relative rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-r from-red-50 to-blue-50">
            <div className="backdrop-blur-sm rounded-xl sm:rounded-2xl bg-white/80 p-6 sm:p-8 md:p-12 border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">

                {/* Text */}
                <div className="lg:col-span-7 text-center lg:text-left">
                  <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 leading-tight">
                    <span style={{ color: "#022030" }}>Stay Connected with </span>
                    <span style={{ color: "#ff0000" }}>DE employmint</span>
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-light max-w-2xl mx-auto lg:mx-0">
                    Join our community to receive the latest insights on talent
                    acquisition, industry trends, and innovative recruitment
                    solutions tailored for India's financial services sector.
                  </p>
                </div>

                {/* Email input */}
                <div className="lg:col-span-5">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative overflow-hidden rounded-xl bg-gray-50 border border-gray-200 p-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white px-4 sm:px-6 py-3 sm:py-4 text-gray-800 placeholder-gray-500 rounded-lg focus:outline-none border-0 text-sm sm:text-base"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      className={`w-full py-3 sm:py-4 px-6 rounded-xl font-medium text-white transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 text-sm sm:text-base ${
                        submitted
                          ? "bg-green-600"
                          : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      }`}
                      style={!submitted ? { boxShadow: "0 4px 14px 0 rgba(255,0,0,0.3)" } : {}}
                    >
                      {submitted ? "Subscribed!" : "Get Updates"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="border-t border-gray-200 pt-10 sm:pt-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">

            {/* Sectors We Serve */}
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-200" style={{ color: "#022030" }}>
                Sectors We Serve
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {["Life Insurance", "General Insurance", "Equity Broking", "Equity Research", "Wealth Management"].map((item) => (
                  <li key={item}>
                    <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base">
                      <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Our Services */}
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-200" style={{ color: "#022030" }}>
                Our Services
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {["End to End Recruitment", "Payroll Processing", "Salary Bench Marking", "Training", "HCM System & Process Implemention"].map((item) => (
                  <li key={item}>
                    <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base">
                      <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-200" style={{ color: "#022030" }}>
                Solutions
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {["Career Board & Sourcing", "HR Payroll Software", "On Boarding Solution", "Learning & Development Solutions", "Performance Management"].map((item) => (
                  <li key={item}>
                    <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base">
                      <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-200" style={{ color: "#022030" }}>
                Company
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link
                    to="/about"
                    onClick={scrollToTop}
                    className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base"
                  >
                    <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                    About DE employmint
                  </Link>
                </li>
                <li>
                  <Link
                    to="/vision-mission"
                    onClick={scrollToTop}
                    className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base"
                  >
                    <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                    Our Vision & Mission
                  </Link>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base">
                    <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                    Career Board
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base">
                    <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                    Join Our Team
                  </a>
                </li>
                <li>
                  <Link
                    to="/contact"
                    onClick={scrollToTop}
                    className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center text-sm sm:text-base"
                  >
                    <span className="text-red-500 mr-2 flex-shrink-0">→</span>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Social + Copyright */}
        <div className="mt-10 sm:mt-14 border-t border-gray-200 pt-8 sm:pt-10 flex flex-col items-center gap-4 sm:gap-5">
          {/* Social icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Facebook */}
            <a href="https://www.facebook.com/profile.php?id=61572949730309" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center group hover:bg-red-600 transition-all duration-300">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a href="https://www.linkedin.com/company/de-employmint/posts/?feedView=all&viewAsMember=true" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center group hover:bg-red-600 transition-all duration-300">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>

            {/* Instagram */}
            <a href="https://www.instagram.com/jobsbydemint?igsh=MTM5ZGQ4OXhkMGc5ZQ==" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center group hover:bg-red-600 transition-all duration-300">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:text-white" fill="currentColor" viewBox="0 0 448 512">
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9S160.5 370.8 224.1 370.8 339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.2 0-74.7-33.5-74.7-74.7 0-41.2 33.5-74.7 74.7-74.7 41.2 0 74.7 33.5 74.7 74.7 0 41.2-33.5 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.9-26.9 26.9s-26.9-12-26.9-26.9 12-26.9 26.9-26.9 26.9 12 26.9 26.9zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9C384.3 23.9 352.5 15.7 316.6 14c-35.9-1.7-143.3-1.7-179.2 0-35.9 1.7-67.7 9.9-93.9 36.2C17.2 76.5 9 108.3 7.3 144.2c-1.7 35.9-1.7 143.3 0 179.2 1.7 35.9 9.9 67.7 36.2 93.9 26.2 26.2 58 34.4 93.9 36.2 35.9 1.7 143.3 1.7 179.2 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 1.7-35.9 1.7-143.3 0-179.2zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.6 102.7-9 132.1z"/>
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs sm:text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} DE employmint. All rights reserved.
          </p>
        </div>

      </div>

      {/* Gradient line */}
      <div className="mt-8 sm:mt-10 h-1 w-full" style={{ background: "linear-gradient(to right, #FF0000, #022030, #FF0000)" }}></div>
    </footer>
  );
};

export default Footer;