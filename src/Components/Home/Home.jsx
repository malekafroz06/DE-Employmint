
import React, { useState } from "react";
import BannerBackground from "../../Assets/home-banner-background.png";
import BannerVideo from "../../Assets/Video.mp4";
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
      <div className="home-banner-container">
        <div className="home-bannerImage-container">
          <img src={BannerBackground} alt="" />
        </div>
        <div className="home-text-section">
          <h1 className="primary-heading">
            Got Talent ?<br />Meet Opportunity
          </h1>

          <p className="primary-text">
            Company reviews. Salaries. Interviews. Jobs. Everything you need to know about your dream job.
          </p>
          <JobSearch/>
           {/* Popular searches */}
      <div className="popular-categories">
        <span>Popular Searches: </span>
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
          {/* <button className="secondary-button" style={{marginTop: '2rem'}}>
            Explore Jobs <FiArrowRight />
          </button> */}
        </div>
        <div className="home-image-section">
          <video 
            src={BannerVideo} 
            autoPlay 
            loop 
            muted 
            playsInline
          />
        </div>
         
      </div>
     <RoleSection/>
     <Workk />
     <Testimonial/>
     
    </div>
    
   
  );
};


export default Home;