import React, { useState, useRef, useEffect } from "react";
import "./Jobsearch.css";

const JobSearch = () => {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All industries");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

 const suggestions = [
    "Data Analyst",
    "Senior Software Engineer", 
    "UX/UI Designer",
    "Part-Time Marketer",
    "Full Stack Developer",
    "Cloud Solutions Architec",
    "Database Administrator",
    "Junior UI/UX Designer",
    "Operations Manager",
    "Frontend Developer",
    "Product Manager",
    "Social Media Intern"
  ];
  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(keyword.toLowerCase()) && keyword.length > 0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    window.location.href = `/candidatedashboard?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
    console.log("Search request:", { keyword, location });
  };

  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    setShowSuggestions(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setKeyword(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Focus back on input after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filtered.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(filtered[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click events to fire
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleFocus = () => {
    if (keyword.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.parentElement.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="civi-search-horizontal">
      <form className="form-search-horizontal" onSubmit={handleSubmit}>
        <div className="search-horizontal-inner">

          {/* 🔍 Job title */}
          <div className="form-group1" style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              className="search-horizontal-control"
              type="text"
              placeholder="Jobs title or keywords"
              autoComplete="off"
              value={keyword}
              onChange={handleKeywordChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />

            {showSuggestions && filtered.length > 0 && (
              <ul style={{
                margin: 0,
                marginLeft: 20,
                padding: 0,
                listStyle: "none",
                position: "absolute",
                top: "100%", // Position below the input
                left: 0,
                background: "#fff",
                width: "calc(100% - 20px)",
                zIndex: 1000,
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                maxHeight: "200px",
                overflowY: "auto",
                marginTop: "2px" // Small gap between input and suggestions
              }}>
                {filtered.slice(0, 5).map((suggestion, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      backgroundColor: selectedIndex === i ? "#f0f0f0" : "transparent",
                      borderBottom: i < filtered.length - 1 ? "1px solid #eee" : "none"
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      handleSuggestionClick(suggestion);
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
           
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
          <div className="form-group1 civi-form-location">
            <select
              className="civi-select2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option>All industries</option>
              <option>Life Insurance</option>
              <option>General Insurance</option>
              <option>Equity Broking</option>
              <option>Equity Research</option>
              <option>Wealth Management</option>
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
          <div className="form-group1">
            <button type="submit" className="btn-search-horizontal civi-button3">
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobSearch;