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
      {/* <Navbar /> */}
      
      {/* FIRST SECTION WITH BACKGROUND IMAGE */}
      <div className="banner-section" style={{
         backgroundImage: `url(${BannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '4rem'
      }}>
        <div className="text-content">
          <h1 className="primary-heading" >
            Got Talent ?<br />Meet Opportunity
          </h1>
           
          <p className="primary-text">
            Company reviews. Salaries. Interviews. Jobs. Everything you need to know about your dream job.
          </p>
          <JobSearch/>
           
          {/* Popular searches */}
          <div className="popular-categories">
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
        </div>
      </div>
      
      {/* OTHER SECTIONS - NO BACKGROUND */}
      <div className="main-content">
        <RoleSection/>
        <Workk />
        <Testimonial/>
      </div>
          
    </div>
           
  );
};

export default Home;