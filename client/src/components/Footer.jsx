import React, { useState } from "react";

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

  return (
    <footer className="relative overflow-hidden pt-20 bg-white">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-red-600 opacity-5 blur-3xl"></div>
        <div
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: "#FF0000" }}
        ></div>
        <div className="absolute top-40 right-1/4 w-40 h-40 rounded-full bg-red-400 opacity-3 blur-2xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="mb-16">
          <div className="relative rounded-3xl p-1 bg-gradient-to-r from-red-50 to-blue-50">
            <div className="backdrop-blur-sm rounded-2xl bg-white/80 p-8 md:p-12 border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7">
                  <h2 className="font-bold text-4xl md:text-5xl mb-4">
                    <span style={{ color: "#022030" }}>Stay Connected with </span>
                    <span style={{ color: "#ff0000" }}>DE employmint</span>
                  </h2>
                  <p className="text-lg text-gray-600 font-light max-w-2xl">
                    Join our community to receive the latest insights on talent
                    acquisition, industry trends, and innovative recruitment
                    solutions tailored for India's financial services sector.
                  </p>
                </div>

                <div className="lg:col-span-5">
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl bg-gray-50 border border-gray-200 p-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white px-6 py-4 text-gray-800 placeholder-gray-500 rounded-lg focus:outline-none border-0"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 ${
                        submitted
                          ? "bg-green-600"
                          : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      }`}
                      style={
                        !submitted
                          ? { boxShadow: "0 4px 14px 0 rgba(255, 0, 0, 0.3)" }
                          : {}
                      }
                    >
                      {submitted ? "Subscribed!" : "Get Updates"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="border-t border-gray-200 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {/* Column 1 - Our Services */}
            <div>
              <h3
                className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200"
                style={{ color: "#022030" }}
              >
                Sectors We Serve
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Life Insurance
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    General Insurance
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Equity Broking
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Equity Research
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Wealth Management
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2 - Our Services */}
            <div>
              <h3
                className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200"
                style={{ color: "#022030" }}
              >
                Our Services
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    End to End Recruitment
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Payroll Processing
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Salary Bench Marking
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Training
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    HCM System & Processs Implemention
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 - Solutions */}
            <div>
              <h3
                className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200"
                style={{ color: "#022030" }}
              >
                Solutions
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Career Board & Sourcing
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    HR Payroll Softwate
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    On Boarding Solution
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Learning & Development Solutions
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Performance Management
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 - Company */}
            <div>
              <h3
                className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200"
                style={{ color: "#022030" }}
              >
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    About DE employmint
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Our Vision & Mission
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Career Board
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Join Our Team
                  </a>
                </li>
                <li>
                  <a href="/" className="text-gray-600 hover:text-red-500 transition-colors duration-300 flex items-center">
                    <span className="text-red-500 mr-2">→</span>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="flex justify-center mt-16 border-t border-gray-200 pt-10">
          <div className="flex space-x-4">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=61572949730309"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group hover:bg-red-600 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 text-red-500 group-hover:text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 
                5.373-12 12c0 5.99 4.388 10.954 10.125 
                11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 
                1.792-4.669 4.533-4.669 1.312 0 
                2.686.235 2.686.235v2.953H15.83c-1.491 
                0-1.956.925-1.956 1.874v2.25h3.328l-.532 
                3.47h-2.796v8.385C19.612 23.027 24 
                18.062 24 12.073z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/101968826/admin/dashboard/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group hover:bg-red-600 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 text-red-500 group-hover:text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 
                0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 
                1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 
                4.267 5.455v6.286zM5.337 7.433c-1.144 
                0-2.063-.926-2.063-2.065 0-1.138.92-2.063 
                2.063-2.063 1.14 0 2.064.925 
                2.064 2.063 0 1.139-.925 2.065-2.064 
                2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 
                0H1.771C.792 0 0 .774 0 
                1.729v20.542C0 23.227.792 24 
                1.771 24h20.451C23.2 24 24 
                23.227 24 22.271V1.729C24 .774 
                23.2 0 22.222 0h.003z" />
              </svg>
            </a>

            {/* Instagram */}
            {/* Instagram */}
<a
  href="https://www.instagram.com/jobsbydemint?igsh=MTM5ZGQ4OXhkMGc5ZQ=="
  target="_blank"
  rel="noopener noreferrer"
  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group hover:bg-red-600 transition-all duration-300"
>
  <svg
    className="w-5 h-5 text-red-500 group-hover:text-white"
    fill="currentColor"
    viewBox="0 0 448 512"
    aria-hidden="true"
  >
    <path d="M224.1 141c-63.6 0-114.9 
      51.3-114.9 114.9S160.5 370.8 224.1 
      370.8 339 319.5 339 255.9 287.7 
      141 224.1 141zm0 189.6c-41.2 0-74.7-33.5-74.7-74.7 
      0-41.2 33.5-74.7 74.7-74.7 41.2 0 74.7 33.5 
      74.7 74.7 0 41.2-33.5 74.7-74.7 74.7zm146.4-194.3c0 
      14.9-12 26.9-26.9 26.9s-26.9-12-26.9-26.9 12-26.9 
      26.9-26.9 26.9 12 26.9 26.9zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9C384.3 
      23.9 352.5 15.7 316.6 14c-35.9-1.7-143.3-1.7-179.2 
      0-35.9 1.7-67.7 9.9-93.9 36.2C17.2 76.5 9 108.3 
      7.3 144.2c-1.7 35.9-1.7 143.3 0 179.2 
      1.7 35.9 9.9 67.7 36.2 93.9 26.2 26.2 
      58 34.4 93.9 36.2 35.9 1.7 143.3 1.7 
      179.2 0 35.9-1.7 67.7-9.9 93.9-36.2 
      26.2-26.2 34.4-58 36.2-93.9 
      1.7-35.9 1.7-143.3 0-179.2zM398.8 
      388c-7.8 19.6-22.9 34.7-42.6 
      42.6-29.5 11.7-99.5 9-132.1 
      9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 
      9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 
      29.5-11.7 99.5-9 132.1-9s102.7-2.6 
      132.1 9c19.6 7.8 34.7 22.9 
      42.6 42.6 11.7 29.5 9 99.5 9 
      132.1s2.6 102.7-9 132.1z"/>
  </svg>
</a>

          </div>
        </div>

        {/* Bottom Bar */}
        {/* <div className="pt-8 mt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div
              className="mr-3 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(to bottom right, #FF0000, #022030)",
              }}
            >
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-xl" style={{ color: "#022030" }}>
              DE employmint
            </span>
          </div>

          <div className="text-sm text-gray-500">© DE employmint 2025</div>

          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/" className="text-sm text-gray-600 hover:text-red-500 transition-colors duration-300">
              Privacy Policy
            </a>
            <a href="/" className="text-sm text-gray-600 hover:text-red-500 transition-colors duration-300">
              Terms of Service
            </a>
          </div>
        </div> */}
      </div>

      {/* Animated gradient line */}
      <div
        className="mt-10 h-1 w-full"
        style={{
          background: "linear-gradient(to right, #FF0000, #022030, #FF0000)",
        }}
      ></div>
    </footer>
  );
};

export default Footer;
