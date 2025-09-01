import React, { useState } from "react";
import './Workk.css';
import {
  ChevronLeft,
  ChevronRight,
  Security,
  CreditCard,
  AttachMoney,
  TrendingUp,
  PieChart,
  BarChart
} from '@mui/icons-material';

const Workk = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsToShow = 3;

  const workInfoData = [
    {
      icon: Security,
      title: "Life Insurance",
      text: "Comprehensive life insurance solutions to protect your family's future and provide financial security.",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      icon: CreditCard,
      title: "General Insurance",
      text: "Complete protection for your assets with our range of general insurance products and services.",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      icon: AttachMoney,
      title: "Non Banking Finance",
      text: "Flexible financing solutions tailored to meet your personal and business financial needs.",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      icon: TrendingUp,
      title: "Equity Broking",
      text: "Professional equity broking services with expert market insights and competitive trading solutions.",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      icon: PieChart,
      title: "Wealth Management",
      text: "Strategic wealth management services to help you grow and preserve your financial assets effectively.",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      icon: BarChart,
      title: "Equity Research",
      text: "In-depth equity research and analysis to support informed investment decisions and market strategies.",
      gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
  ];

  const maxIndex = Math.max(0, workInfoData.length - cardsToShow);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const visibleCards = workInfoData.slice(currentIndex, currentIndex + cardsToShow);

  return (
    <div className="work-section-wrapper">
      <div className="work-section-top">
        <h1 className="primary-heading">Our Area Of Expertise</h1>
        <p className="primary-text">
          From recruitment to payroll and digital HR, we bring domain-focused expertise that fuels business success.
        </p>
      </div>
      
      <div className="work-section-bottom">
        <div className="carousel-container">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className={`nav-arrow nav-arrow-left ${currentIndex === 0 ? 'disabled' : ''}`}
          >
            <ChevronLeft />
          </button>

          <button
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className={`nav-arrow nav-arrow-right ${currentIndex >= maxIndex ? 'disabled' : ''}`}
          >
            <ChevronRight />
          </button>

          {/* Cards */}
          <div className="work-cards-container">
            {visibleCards.map((data, index) => {
              const IconComponent = data.icon;
              return (
                <div className="work-section-info" key={`${data.title}-${currentIndex + index}`}>
                  <div 
                    className="info-boxes-img-container"
                    style={{ 
                      background: data.gradient,
                      backgroundImage: `${data.gradient}, url(${data.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundBlendMode: 'overlay'
                    }}
                  >
                    <div className="icon-overlay">
                      <IconComponent sx={{ fontSize: 48, color: 'white' }} />
                    </div>
                  </div>
                  <h2>{data.title}</h2>
                  <p>{data.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workk;