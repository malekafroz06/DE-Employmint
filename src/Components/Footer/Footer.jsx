import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <div className="footer-wrapper">
      <div className="footer-content">
        <div className="footer-columns">
          <div className="footer-column">
            <h3>Our Services</h3>
            <ul>
              <li>Hiring Solutions</li>
              <li>iRecruto Platform</li>
              <li>Payroll Processing & Benchmarking</li>
              <li>Digital Transformation HR</li>
              <li>Talent Acquisition</li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Industries We Serve</h3>
            <ul>
              <li>Life Insurance</li>
              <li>General Insurance</li>
              <li>Equity Broking</li>
              <li>Equity Research</li>
              <li>Wealth Management</li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Solutions</h3>
            <ul>
              <li>End-to-End Recruitment</li>
              <li>Career Boards</li>
              <li>Intelligent Staffing</li>
              <li>Data-Driven Insights</li>
              <li>HR Digital Solutions</li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li>About DE employmint</li>
              <li>Our Vision & Mission</li>
              <li>Career Board</li>
              <li>Join Our Team</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>

        <div className="newsletter-section">
          <div className="newsletter-content">
            <h3>Stay Connected with DE employmint</h3>
            <p>Join our community to receive the latest insights on talent acquisition, industry trends, and innovative recruitment solutions tailored for India's financial services sector.</p>
          </div>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address" />
            <button className="subscribe-btn">Get Updates</button>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-icons">
            <a href="https://www.facebook.com/profile.php?id=61572949730309" target="_blank" rel="noopener noreferrer" className="social-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/101968826/admin/dashboard/" target="_blank" rel="noopener noreferrer" className="social-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
          <div className="footer-bottom-right">
            <span>© DE employmint 2025</span>
            <span>Privacy & Legal</span>
            <span>Terms & Conditions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;