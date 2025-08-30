import React, { useState, useEffect } from 'react';
import './Candidatedashboard.css';

const Candidatedashboard = () => {
  const [filterStates, setFilterStates] = useState({
    jobType: true,
    careerLevel: true,
    salaryRange: true
  });
  
  const [checkedFilters, setCheckedFilters] = useState({
    jobType: [],
    careerLevel: [],
    salaryRange: []
  });

  const jobListings = [
    { title: "Data Analyst", company: "Tech Solutions", location: "New York, USA", type: "Full-Time", salary: "60k-80k", level: "Entry", description: "We are seeking a data analyst to join our team..." },
    { title: "Senior Software Engineer", company: "Innovate Inc.", location: "San Francisco, USA", type: "Full-Time", salary: "100k+", level: "Senior", description: "Join our dynamic team to build the next generation of applications..." },
    { title: "UX/UI Designer", company: "Creative Co.", location: "Remote", type: "Freelance", salary: "N/A", level: "Mid", description: "Looking for a talented designer to create intuitive user interfaces..." },
    { title: "Part-Time Marketer", company: "Global Brands", location: "London, UK", type: "Part-Time", salary: "20k-40k", level: "Entry", description: "Help us expand our brand presence and reach new customers..." },
    { title: "Full Stack Developer", company: "WebCrafters", location: "Remote", type: "Full-Time", salary: "80k-100k", level: "Mid", description: "Develop and maintain web applications from front to back..." },
    { title: "Cloud Solutions Architect", company: "Azure Corp", location: "Seattle, USA", type: "Full-Time", salary: "100k+", level: "Executive", description: "Design and implement cloud infrastructure for our enterprise clients." },
    { title: "Database Administrator", company: "DataFlow", location: "Remote", type: "Full-Time", salary: "80k-100k", level: "Senior", description: "Manage and optimize our large-scale database systems." },
    { title: "Junior UI/UX Designer", company: "NextGen Agency", location: "Austin, USA", type: "Internship", salary: "N/A", level: "Entry", description: "Assist senior designers in creating mockups and user flows." },
    { title: "Operations Manager", company: "Logistic Inc.", location: "Chicago, USA", type: "Full-Time", salary: "100k+", level: "Senior", description: "Oversee daily operations and improve efficiency across all departments." },
    { title: "Frontend Developer", company: "PixelPerfect", location: "Remote", type: "Freelance", salary: "60k-80k", level: "Mid", description: "Build interactive and responsive user interfaces for our web apps." },
    { title: "Product Manager", company: "Innovation Labs", location: "San Francisco, USA", type: "Full-Time", salary: "100k+", level: "Senior", description: "Lead the development of new products from concept to launch." },
    { title: "Social Media Intern", company: "Brand Boost", location: "Boston, USA", type: "Internship", salary: "N/A", level: "Entry", description: "Help manage social media campaigns and engage with online communities." }
  ];

  const [filteredJobs, setFilteredJobs] = useState(jobListings);

  const toggleFilter = (filterType) => {
    setFilterStates(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const handleFilterChange = (filterType, value, checked) => {
    setCheckedFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearAllFilters = () => {
    setCheckedFilters({
      jobType: [],
      careerLevel: [],
      salaryRange: []
    });
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
  };

  const filterJobs = () => {
    const filtered = jobListings.filter(job => {
      const jobTypeMatch = checkedFilters.jobType.length === 0 || checkedFilters.jobType.includes(job.type);
      const careerLevelMatch = checkedFilters.careerLevel.length === 0 || checkedFilters.careerLevel.includes(job.level);
      const salaryRangeMatch = checkedFilters.salaryRange.length === 0 || checkedFilters.salaryRange.includes(job.salary);
      return jobTypeMatch && careerLevelMatch && salaryRangeMatch;
    });
    setFilteredJobs(filtered);
  };

  useEffect(() => {
    filterJobs();
  }, [checkedFilters]);

  const FilterSection = ({ title, filterType, options }) => (
    <div className="filter-section">
      <h3 className="filter-title" onClick={() => toggleFilter(filterType)}>
        {title}
      </h3>
      <div className={`filter-options ${filterStates[filterType] ? 'show' : ''}`}>
        {options.map(option => (
          <label key={option.value} className="filter-option">
            <input
              type="checkbox"
              value={option.value}
              onChange={(e) => handleFilterChange(filterType, option.value, e.target.checked)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const JobCard = ({ job }) => (
    <div className="job-card">
      <h3 className="job-title">{job.title}</h3>
      <p className="job-company">{job.company} - <span className="job-location">{job.location}</span></p>
      <div className="job-tags">
        <span className="job-tag">{job.type}</span>
        <span className="job-tag">{job.level}</span>
        {job.salary !== "N/A" && <span className="job-tag salary-tag">${job.salary}</span>}
      </div>
      <p className="job-description">{job.description}</p>
      <button className="apply-btn">Apply Now</button>
    </div>
  );

  return (
    <div className="candidate-jobs">
      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* Filters Section */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h2 className="filters-title">Filters</h2>
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                 Clear All
              </button>
            </div>
            
            <FilterSection
              title="Job Type"
              filterType="jobType"
              options={[
                { value: "Full-Time", label: "Full-Time" },
                { value: "Part-Time", label: "Part-Time" },
                { value: "Freelance", label: "Freelance" },
                { value: "Internship", label: "Internship" }
              ]}
            />

            <FilterSection
              title="Career Level"
              filterType="careerLevel"
              options={[
                { value: "Entry", label: "Entry" },
                { value: "Mid", label: "Mid" },
                { value: "Senior", label: "Senior" },
                { value: "Executive", label: "Executive" }
              ]}
            />

            <FilterSection
              title="Salary Range"
              filterType="salaryRange"
              options={[
                { value: "20k-40k", label: "$20k - $40k" },
                { value: "40k-60k", label: "$40k - $60k" },
                { value: "60k-80k", label: "$60k - $80k" },
                { value: "80k-100k", label: "$80k - $100k" },
                { value: "100k+", label: "$100k+" }
              ]}
            />
          </aside>

          {/* Job Listings Section */}
          <div className="job-listings-section">
            <h1 className="section-title">Available Jobs</h1>
            <div className="job-listings-grid">
              {filteredJobs.length === 0 ? (
                <p className="no-jobs">No jobs match your selected filters.</p>
              ) : (
                filteredJobs.map((job, index) => (
                  <JobCard key={index} job={job} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Candidatedashboard;