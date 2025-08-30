import React from "react";
import "./RoleSection.css";
import Employee from "../../Assets/Employee.svg";
import Employer from "../../Assets/Employer.svg";

// Importing icons from react-icons
import { FaLaptopCode, FaChartLine, FaPaintBrush, FaHeadset, FaBriefcase, FaDatabase } from "react-icons/fa";
const scrollCategories = (direction) => {
  const container = document.getElementById("categories-container");
  const scrollAmount = 350; // how much to scroll

  if (direction === "left") {
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }
};

const RoleSection = () => {
  const categories = [
    {
      id: 1,
      icon: <FaLaptopCode />,
      title: "Development & IT",
      description: "Frontend, backend, web and app developer jobs.",
      count: 523
    },
    {
      id: 2,
      icon: <FaChartLine />,
      title: "Marketing & Sales",
      description: "Advertising, digital marketing and brand...",
      count: 312
    },
    {
      id: 3,
      icon: <FaPaintBrush />,
      title: "Design & Creative",
      description: "Graphic, digital, web, and product design jobs.",
      count: 287
    },
    {
      id: 4,
      icon: <FaHeadset />,
      title: "Customer Service",
      description: "Customer experience and account management jobs.",
      count: 198
    },
    {
      id: 5,
      icon: <FaBriefcase />,
      title: "Business & Finance",
      description: "Accounting, consulting, and business analysis jobs.",
      count: 156
    },
    {
      id: 6,
      icon: <FaDatabase />,
      title: "Data & Analytics",
      description: "Data science, analytics, and research positions.",
      count: 142
    }
  ];

  return (
    <div className="role-section-container">
      <div className="role-header">
        <div className="role-cards-container">
          {/* Employer Card */}
          <div className="role-card employer-card">
            <div className="card-content">
              <h2>For Employers</h2>
              <p>Find professionals from around the world and across all skills.</p>
              <button className="role-button employer-btn">Post jobs for Free</button>
            </div>
            <div className="card-illustration">
              <img
                src={Employer}
                alt="Employer Illustration"
                className="role-illustration"
              />
            </div>
          </div>

          {/* Candidate Card */}
          <div className="role-card candidate-card">
            <div className="card-content">
              <h2>For Candidate</h2>
              <p>Build your professional profile, find new job opportunities.</p>
              <button className="role-button candidate-btn">Upload your CV</button>
            </div>
            <div className="card-illustration">
              <img
                src={Employee}
                alt="Candidate Illustration"
                className="role-illustration"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="categories-section">
  <div className="categories-header">
    <div className="categories-title">
      <h2>Popular category</h2>
      <p className="job-stats">2020 jobs live – 293 added today.</p>
    </div>
    <a href="" className="vi">View all categories</a>
  </div>

  <div className="categories-carousel">
    <button className="arrow-btn left" onClick={() => scrollCategories("left")}>
      &#8249;
    </button>

    <div className="categories-grid" id="categories-container">
      {categories.map((category) => (
        <div key={category.id} className="category-card">
          <div className="category-icon">
            {category.icon}
          </div>
          <div className="category-content">
            <h3>{category.title}</h3>
            <p>{category.description}</p>
            <span className="job-count">{category.count} jobs</span>
          </div>
        </div>
      ))}
    </div>

    <button className="arrow-btn right" onClick={() => scrollCategories("right")}>
      &#8250;
    </button>
  </div>
</div>

    </div>
  );
};

export default RoleSection;
