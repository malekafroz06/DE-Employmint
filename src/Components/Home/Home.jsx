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

  // Sample profile photos data for floating elements - 3 on each side with more distance
  const floatingProfiles = [
    { id: 1, src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', position: 'left-top' },
    { id: 2, src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face', position: 'left-middle' },
    { id: 3, src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', position: 'left-bottom' },
    { id: 4, src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', position: 'right-top' },
    { id: 5, src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', position: 'right-middle' },
    { id: 6, src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', position: 'right-bottom' },
  ];

  return (
    <div className="home-container">
      {/* FIRST SECTION WITH BACKGROUND IMAGE */}
      {/* <div className="banner-section" style={{
        backgroundImage: `url(${BannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '4rem'
      }}> */}
      
      {/* Text content with floating profiles */}
      <div className="text-content" style={{ position: 'relative' }}>
        
        {/* Floating Profile Photos - 3 on each side pushed further to edges */}
        {floatingProfiles.map((profile) => (
          <div
            key={profile.id}
            style={{
              position: 'absolute',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(255, 0, 0, 0.3)',
              border: '3px solid #FF0000',
              zIndex: 1,
              transition: 'all 0.3s ease',
              animation: `float${profile.id} ${3 + profile.id * 0.2}s ease-in-out infinite`,
              animationDelay: `${profile.id * 0.3}s`,
              ...(profile.position === 'left-top' && {
                top: '5%',
                left: '15%'
              }),
              ...(profile.position === 'left-middle' && {
                top: '55%',
                left: '8%'
              }),
              ...(profile.position === 'left-bottom' && {
                bottom: '8%',
                left: '20%'
              }),
              ...(profile.position === 'right-top' && {
                top: '12%',
                right: '18%'
              }),
              ...(profile.position === 'right-middle' && {
                top: '48%',
                right: '10%'
              }),
              ...(profile.position === 'right-bottom' && {
                bottom: '15%',
                right: '25%'
              })
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 0, 0, 0.5)';
              e.currentTarget.style.borderColor = '#FF3333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = '#FF0000';
            }}
          >
            <img 
              src={profile.src} 
              alt={`Profile ${profile.id}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        ))}

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
      </div>
      
      <div className="main-content">
        <RoleSection/>
        <Workk />
        <Testimonial/>
      </div>

      {/* CSS animations for floating effect with red theme */}
      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-3deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-22px) rotate(2deg); }
        }
        @keyframes float4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-28px) rotate(-2deg); }
        }
        @keyframes float5 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(4deg); }
        }
        @keyframes float6 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-32px) rotate(-3deg); }
        }

        @media (max-width: 768px) {
          .text-content > div[style*="position: absolute"] {
            display: none;
          }
        }
        
        @media (min-width: 1200px) {
          .text-content > div[style*="position: absolute"] {
            width: 90px !important;
            height: 90px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;