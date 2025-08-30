import React from "react";
import ProfilePic from "../../Assets/john-doe-image.png";
import { AiFillStar } from "react-icons/ai";
import "./Testimonial.css";

const Testimonial = () => {
  return (
    <div className="work-section-wrapper">
      <div className="work-section-top">
        <p className="primary-subheading">What People Says</p>
        <h1 className="primary-heading">About DE employmint</h1>
        <p className="primary-text">
          At DE employmint, we simplify hiring with a human touch. Businesses trust us to deliver talent that fits the role and aligns with their culture
        </p>
      </div>
      <div className="testimonial-section-bottom">
        <img src={ProfilePic} alt="" />
        <p>
         Job seekers appreciate our transparent, supportive approach that empowers them to discover meaningful career opportunities. With domain expertise and innovative solutions, we’ve built a reputation as a trusted partner in shaping successful journeys.
        </p>
        <div className="testimonials-stars-container">
          <AiFillStar />
          <AiFillStar />
          <AiFillStar />
          <AiFillStar />
          <AiFillStar />
        </div>
        <h2>John Doe</h2>
      </div>
    </div>
  );
};

export default Testimonial;
