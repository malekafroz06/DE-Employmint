import React, { useState } from "react";
import BannerBackground from "../../Assets/home-banner-background.png";
import BannerImage from "../../Assets/e2.jpg";
import Navbar from "../Navbar/Navbar";
import { FiArrowRight } from "react-icons/fi";
import './Home.css';
import JobSearch from "../Jobsearch/Jobsearch";
import RoleSection from "../RoleSection/RoleSection";
import Workk from "../Workk/Workk";
import { Work } from "@mui/icons-material";
import Testimonial from "../Testimonial/Testimonial";

const Home = () => {
  const [keyword, setKeyword] = useState("");



  return (
    <div className="home-container">
    
        <h1 className="primary-heading" style={{ position: 'relative', zIndex: 2 }}>
          <span className="primary2">Got Talent ?  </span><br />Meet Opportunity
        </h1>
        
        <p className="primary-text" style={{ position: 'relative', zIndex: 2 }}>
          Company reviews. Salaries. Interviews. Jobs. Everything you need to know about your dream job.
        </p>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <JobSearch/>
        </div>
        
        {/* Popular searches */}
        <div className="popular-categories" style={{ position: 'relative', zIndex: 2 }}>
          <span color="white">Popular Searches: </span>
          <ul className="list-category">
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setKeyword("Wireframing");
                }}
              >
                Wireframing
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setKeyword("Responsive Design");
                }}
              >
                Responsive Design
              </a>
            </li>
          </ul>
        </div>
    
      
      <div className="main-content">
        <RoleSection/>
        <Workk />
        <Testimonial/>
      </div>
    </div>
    
    
  );
};

export default Home;