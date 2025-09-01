import React, { useState } from "react";
import "./Jobsearch.css";

const JobSearch = () => {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All Cities");
 const suggestions = [
    "Software Developer",
    "UI/UX Designer",
    "Wireframing",
    "Responsive Design",
    "Project Manager",
  ];
  const handleSubmit = (e) => {
    e.preventDefault();

    // 👉 Here you connect to your backend (API call, navigate, etc.)
    console.log("Search request:", { keyword, location });

    // Example redirect:
    // window.location.href = `/jobs?keyword=${keyword}&location=${location}`;
  };
  

  return (
    <div className="civi-search-horizontal">
      <form className="form-search-horizontal" onSubmit={handleSubmit}>
        <div className="search-horizontal-inner">

          {/* 🔍 Job title */}
          <div className="form-group">
            <input
              className="search-horizontal-control"
              type="text"
              placeholder="Jobs title or keywords"
              autoComplete="off"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <span className="btn-filter-search">
              {/* Inline SVG Magnifier */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#FF0000"
                viewBox="0 0 24 24"
              >
                <path d="M21 20l-5.6-5.6A7.9 7.9 0 0 0 17 10a8 8 0 1 0-8 8c1.8 0 3.4-.6 4.7-1.6L20 21l1-1zm-11-4a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
              </svg>
            </span>
          </div>

          {/* 📍 Location */}
          <div className="form-group civi-form-location">
            <select
              className="civi-select2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option>All Cities</option>
              <option>New York</option>
              <option>San Francisco</option>
              <option>Chicago</option>
              <option>Boston</option>
            </select>
            {/* Inline SVG Target Icon */}
            <span className="icon-location">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#FF0000"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-2v5l4.3 2.6.7-1.2-3-1.8z" />
              </svg>
            </span>
            {/* Dropdown Arrow */}
            <span className="icon-arrow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="#FF0000"
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </span>
          </div>

          {/* 🔴 Search Button */}
          <div className="form-group">
            <button  type="submit" className="btn-search-horizontal civi-button">
              <a href="/candidatedashboard" style={{ color: "white", textDecoration: "none" }}> Search</a>
             
            </button>
          
          </div>
        </div>
      </form>

     
    </div>
  );
};

export default JobSearch;
