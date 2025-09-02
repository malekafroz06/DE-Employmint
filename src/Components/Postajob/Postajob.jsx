import { useState } from 'react';
import './Postajob.css';
import ProfilePic from "../../Assets/john-doe-image.png";
import { FaCheck } from "react-icons/fa";
 const pricingPlans = [
    {
      id: 1,
      title: "Trial",
      price: "Free",
      timeUnit: "month",
      isRecommended: false,
      features: [
        {  icon: <FaCheck />, badge: "5", text: "job posting" },
        { icon:   <FaCheck />, badge: "1", text: "featured job" },
        { icon:   <FaCheck />, badge: "2", text: "candidates follow" },
        { icon:  <FaCheck />, badge: "2", text: "Download CV" },
        { icon:  <FaCheck />, badge: "Limited support", text: "" }
      ],
      buttonText: "Get Started",
      packageId: "1934"
    },
    {
      id: 2,
      title: "Starter",
      price: "Free",
      timeUnit: "month",
      isRecommended: true,
      features: [
        { icon: "fas fa-check", badge: "10", text: "job posting" },
        { icon: "fas fa-check", badge: "5", text: "featured job" },
        { icon: "fas fa-check", badge: "2", text: "candidates follow" },
        { icon: "fas fa-check", badge: "50", text: "Download CV" },
        { icon: "fas fa-check", badge: "Invite Candidates", text: "" },
        { icon: "fas fa-check", badge: "Send Messages", text: "" },
        { icon: "fas fa-check", badge: "Print candidate profiles", text: "" },
        { icon: "fas fa-check", badge: "Review and comment", text: "" },
        { icon: "fas fa-check", badge: "View candidate information", text: "" },
        { icon: "fas fa-check", badge: "Limited support", text: "" }
      ],
      buttonText: "Get Started",
      packageId: "103"
    },
    {
      id: 3,
      title: "Growth",
      price: "Free",
      timeUnit: "month",
      isRecommended: false,
      features: [
        { icon: "fas fa-check", badge: "15", text: "job posting" },
        { icon: "fas fa-check", badge: "10", text: "featured job" },
        { icon: "fas fa-check", badge: "150", text: "Download CV" },
        { icon: "fas fa-check", badge: "Print candidate profiles", text: "" },
        { icon: "fas fa-check", badge: "Limited support", text: "" }
      ],
      buttonText: "Get Started",
      packageId: "98"
    }
  ];

  const handleGetStarted = (packageId) => {
    // Handle navigation to payment page
    window.location.href = `/payment?package_id=${packageId}`;
  };

const Postajob = () => {

    const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      title: "The support is awesome",
      text: "I really love this theme. It has a beautiful design. From the web developer point of view, it's also really simple to use. And above all, customer support is awesome.",
      name: "Cristofer George",
      position: "Designer at Shopify",
     image: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      id: 2,
      title: "The support is awesome",
      text: "I really love this theme. It has a beautiful design. From the web developer point of view, it's also really simple to use. And above all, customer support is awesome.",
      name: "John Doe",
      position: "Web Designer",
   image: "https://randomuser.me/api/portraits/men/5.jpg"
    },
    {
      id: 3,
      title: "The support is awesome",
      text: "I really love this theme. It has a beautiful design. From the web developer point of view, it's also really simple to use. And above all, customer support is awesome.",
      name: "Selena Gomez",
      position: "Customer Service",
      image: "https://randomuser.me/api/portraits/women/2.jpg"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
   const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
    // Add your login logic here
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    console.log('Reset password for:', resetEmail);
    // Add your reset password logic here
  };

  return (
    <div className="post-job-container">
      {/* First Section - Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            {/* Left Column */}
            <div className="hero-content">
              <div className="content-wrapper">
                {/* Heading Structure */}
                <div className="civi-modern-heading">
                  <div className="heading-secondary-wrap">
                    <h3 className="heading-secondary">
                      For Employers
                    </h3>
                  </div>
                  
                  <div className="heading-primary-wrap">
                    <h2 className="heading-primary">
                      Looking to <br /> post a job?
                    </h2>
                  </div>
                  
                  <div className="heading-description-wrap">
                    <div className="heading-description">
                      Find professionals from around the <br /> world and across all skills.
                    </div>
                  </div>
                  <div className="button-wrapper">
                <button 
                      className="civi-button2" 
                onClick={() => {
                    
             const element = document.getElementById("form-register");
                   if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
               }
               }}
                     >
                       <span>Become an Employer</span>
</button>
                </div>
                </div>

                {/* Button */}
                

                {/* Floating Icons - Left Side */}
                <div className="floating-icon icon-1">
                  <div className="icon-circle blue">
                    <div className="icon-dot"></div>
                  </div>
                </div>

                <div className="floating-icon icon-2">
                  <div className="icon-circle purple">
                    <div className="icon-dot"></div>
                  </div>
                </div>

                <div className="floating-icon icon-3">
                  <div className="icon-circle green">
                    <div className="icon-dot"></div>
                  </div>
                </div>

                <div className="floating-icon icon-4">
                  <div className="icon-circle yellow">
                    <div className="icon-dot"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Main Image */}
            <div className="hero-image">
              <div className="main-illustration">
                {/* Main Illustration */}
                <div className="illustration-container">
                  <div className="main-card">
                    <div className="card-content">
                      {/* Job Card Mockup */}
                      <div className="job-card">
                        <div className="job-header">
                          <div className="company-logo">
                            <svg className="logo-icon" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                            </svg>
                          </div>
                          <div className="job-info">
                            <h4 className="job-title">Senior Developer</h4>
                            <p className="company-name">Tech Solutions Inc.</p>
                            <div className="job-description">
                              <div className="desc-line line-1"></div>
                              <div className="desc-line line-2"></div>
                              <div className="desc-line line-3"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Candidate Profiles */}
                      <div className="candidate-grid">
                        <div className="candidate-card">
                          <div className="candidate-avatar blue-avatar">
                            <span>A</span>
                          </div>
                          <div className="candidate-info">
                            <div className="info-line line-1"></div>
                            <div className="info-line line-2"></div>
                          </div>
                        </div>
                        
                        <div className="candidate-card">
                          <div className="candidate-avatar green-avatar">
                            <span>B</span>
                          </div>
                          <div className="candidate-info">
                            <div className="info-line line-1"></div>
                            <div className="info-line line-2"></div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="stats-card">
                        <div className="stats-content">
                          <div className="stats-number">88.9M+</div>
                          <div className="stats-label">Active Job Seekers</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Icons Around Main Image */}
                <div className="floating-icon-right icon-right-1">
                  <div className="icon-circle orange">
                    <div className="icon-dot"></div>
                  </div>
                </div>

                <div className="floating-icon-right icon-right-2">
                  <div className="icon-circle pink">
                    <div className="icon-dot"></div>
                  </div>
                </div>

                <div className="floating-icon-right icon-right-3">
                  <div className="icon-circle indigo">
                    <div className="icon-dot"></div>
                  </div>
                </div>

                <div className="floating-icon-right icon-right-4">
                  <div className="icon-circle teal">
                    <div className="icon-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Second Section - Key Benefits */}
      <section className="benefits-section">
        <div className="container">
          <div className="benefits-wrapper">
            {/* Section Heading */}
            <div className="section-heading">
              <div className="civi-modern-heading">
                <div className="heading-primary-wrap">
                  <h2 className="heading-primary">
                    Key benefits
                  </h2>
                </div>
                <div className="heading-description-wrap">
                  <div className="heading-description">
                    <p>Why choose Civi job posting?</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="benefits-grid">
              
              {/* Benefit 1 */}
              <div className="benefit-item">
                <div className="civi-image-box">
                  <div className="content-wrap">
                    <div className="benefit-icon">
                      <div className="icon-container">
                        <svg className="benefit-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="benefit-content">
                      <h3 className="benefit-title">
                        2 minutes to post
                      </h3>
                      <div className="benefit-description">
                        Quick and easy to post job posting with<br />
                        highly optimised job posting form
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="benefit-item">
                <div className="civi-image-box">
                  <div className="content-wrap">
                    <div className="benefit-icon">
                      <div className="icon-container">
                        <svg className="benefit-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="benefit-content">
                      <h3 className="benefit-title">
                        Attract audience
                      </h3>
                      <div className="benefit-description">
                        Reach to over 88.9 million talented<br />
                        jobseekers
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="benefit-item">
                <div className="civi-image-box">
                  <div className="content-wrap">
                    <div className="benefit-icon">
                      <div className="icon-container">
                        <svg className="benefit-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="benefit-content">
                      <h3 className="benefit-title">
                        30 days visibility
                      </h3>
                      <div className="benefit-description">
                        Get quality applies guaranteed with 30<br />
                        days visibility of your job ads.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
      <section className="pricing-section">
      <div className="pricing-container">
        <div className="pricing-column">
          <div className="pricing-content">
            {/* Header */}
            <div className="pricing-header">
              <div className="heading-primary-wrap">
                <h2 className="heading-primary">
                  Simple, transparent pricing
                </h2>
              </div>
              <div className="heading-description-wrap">
                <div className="heading-description">
                  Our simple, per-job pricing scales with you.
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="civi-package-wrap">
              <div className="pricing-row">
                {pricingPlans.map((plan) => (
                  <div key={plan.id} className="pricing-col">
                    <div className={`civi-package-item ${plan.isRecommended ? 'active' : ''}`}>
                      {/* Package Title */}
                      <div className="civi-package-title">
                        <h2 className="entry-title">{plan.title}</h2>
                        {plan.isRecommended && (
                          <span className="recommended">Recommended</span>
                        )}
                      </div>

                      {/* Package Price */}
                      <div className="civi-package-price">
                        {plan.price}
                        <span className="time-unit">{plan.timeUnit}</span>
                      </div>

                      {/* Features List */}
                      <ul className="list-group custom-scrollbar">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="list-group-item">
                            <i className="fas fa-check check-icon"></i>
                            <span className="badge">
                              {feature.badge}
                            </span>
                            {feature.text && <span className="feature-text">{feature.text}</span>}
                          </li>
                        ))}
                      </ul>

                      {/* Package Button */}
                      <div className="civi-package-choose">
                        <button
                          onClick={() => handleGetStarted(plan.packageId)}
                          className="civi-button button-outline button-block"
                        >
                          {plan.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
   
       <section className="partners-section">
        <div className="container">
          <div className="heading-wrap">
            <h2 className="main-heading">Our partner</h2>
            <p className="heading-description">Trusted by the world's leading companies</p>
          </div>
          
          {/* Partner Logos Row 1 */}
    <div className="partners-row">
        <div className="partner-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="280" height="80" viewBox="0 0 280 80" fill="none">
            <path d="M20 20 L35 20 L35 35 L20 35 Z M20 40 L35 40 L35 55 L20 55 Z" fill="currentColor"/>
            <text x="50" y="45" fill="currentColor" fontSize="50" fontWeight="bold" fontFamily="Arial">Framer</text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80" fill="none">
            <rect x="20" y="32" width="80" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="3"/>
            <text x="30" y="44" fill="currentColor" fontSize="20" fontWeight="bold" fontFamily="monospace">code</text>
            {/* <rect x="110" y="32" width="120" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="3"/> */}
            <text x="120" y="44" fill="currentColor" fontSize="50" fontWeight="bold" fontFamily="monospace">cademy</text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80" fill="none">
            <circle cx="30" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="55" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="3"/>
            <text x="85" y="48" fill="currentColor" fontSize="50" fontWeight="bold" fontFamily="Arial">classpass</text>
          </svg>
        </div>
      </div>
      </div>
      {/* Partner Logos Row 2: GitHub, Discord, Square */}
      <div className="partners-row">
        <div className="partner-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="260" height="80" viewBox="0 0 260 80" fill="none">
            <circle cx="35" cy="40" r="20" fill="currentColor"/>
            <path d="M25 30 L35 20 L45 30 L35 50 Z" fill="white"/>
            <text x="65" y="48" fill="currentColor" fontSize="50" fontWeight="bold" fontFamily="Arial">GitHub</text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="280" height="80" viewBox="0 0 280 80" fill="none">
            <ellipse cx="35" cy="40" rx="20" ry="15" fill="currentColor"/>
            <circle cx="28" cy="35" r="4" fill="white"/>
            <circle cx="42" cy="35" r="4" fill="white"/>
            <path d="M22 48 Q35 52 48 48" stroke="white" strokeWidth="3" fill="none"/>
            <text x="70" y="48" fill="currentColor" fontSize="50" fontWeight="bold" fontFamily="Arial">Discord</text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80" fill="none">
            <rect x="20" y="28" width="24" height="24" rx="4" fill="currentColor"/>
            <text x="60" y="48" fill="currentColor" fontSize="50" fontWeight="bold" fontFamily="Arial">Square</text>
          </svg>
        </div>
      </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonial-carousel">
            <button className="carousel-btn prev-btn" onClick={prevTestimonial}>
              ‹
            </button>
            
            <div className="testimonial-content">
              <div className="testimonial-item">
                <div className="testimonial-image">
                  <img 
                    src={testimonials[currentTestimonial].image} 
                    alt={testimonials[currentTestimonial].name}
                    width="128" 
                    height="128"
                  />
                </div>
                <div className="testimonial-text">
                  <h4 className="testimonial-title">{testimonials[currentTestimonial].title}</h4>
                  <p className="testimonial-quote">{testimonials[currentTestimonial].text}</p>
                </div>
                <div className="testimonial-author">
                  <h4 className="author-name">{testimonials[currentTestimonial].name}</h4>
                  <span className="author-position">{testimonials[currentTestimonial].position}</span>
                </div>
              </div>
            </div>

            <button className="carousel-btn next-btn" onClick={nextTestimonial}>
              ›
            </button>
          </div>

          {/* Dots indicator */}
          <div className="carousel-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="bg-decoration">
          <div className="decoration-item item-1"></div>
          <div className="decoration-item item-2"></div>
          <div className="decoration-item item-3"></div>
          <div className="decoration-item item-4"></div>
        </div>
      </section>
    
      <section className="recruiter-section" id="form-register">
      <div className="recruiter-container">
        <div className="recruiter-column-left">
          <div className="recruiter-widget-wrap">
            <div className="recruiter-heading">
              <div className="heading-primary-wrap">
                <h2 className="heading-primary">
                  Are you a recruiter? <br />
                  Become a member now
                </h2>
              </div>
            </div>

            <div className="recruiter-form-container">
              {!showResetPassword ? (
                <form className="form-account" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="el_ip_email" className="label-field">
                      Account or Email
                    </label>
                  <div>  <input
                      type="text"
                      id="el_ip_email"
                      className="form-control input-field"
                      name="email"
                      placeholder=" Enter Account or Email "
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    /></div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="el_ip_password" className="label-field">
                      Password
                    </label>
                  <div>  <input
                      type="password"
                      id="el_ip_password"
                      className="form-control input-field"
                      name="password"
                      autoComplete="on"
                      placeholder="Enter Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    /></div>
                  </div>

                  <div className="form-group">
                    <div className="forgot-password">
                      <span>Forgot your password? </span>
                      <button
                        type="button"
                        className="btn-reset-password"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Reset password.
                      </button>
                    </div>
                  </div>

                  <p className="msg">Sending login info, please wait...</p>

                  <div className="form-group">
                    <input type="hidden" name="current_page" value="https://bluebridgemanpower.com/employer-landing" />
                    <input type="hidden" name="civi_recaptcha" value="0" />
                    <button type="submit" className="gl-button btn button">
                      Sign in
                    </button>
                  </div>
                </form>
              ) : (
                <div className="civi-reset-password-wrap form-account">
                  <div id="civi_messages_reset_password" className="civi_messages message"></div>
                  <form onSubmit={handleResetPassword}>
                    <div className="form-group control-username">
                      <input
                        name="user_login"
                        id="el_user_login"
                        className="form-control control-icon"
                        placeholder="Enter your username or email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                      <input type="hidden" id="el_civi_security_reset_password" name="el_civi_security_reset_password" value="6ed9739b64" />
                      <input type="hidden" name="_wp_http_referer" value="/employer-landing/" />
                      <input type="hidden" name="action" id="el_reset_password_action" value="civi_reset_password_ajax" />
                      <input type="hidden" name="type" value="elementor" />
                      <p className="msg">Sending info, please wait...</p>
                      <button type="submit" className="civi_forgetpass btn gl-button">
                        Get new password
                      </button>
                    </div>
                  </form>
                  <button
                    className="back-to-login"
                    onClick={() => setShowResetPassword(false)}
                  >
                    <i className="fas fa-arrow-left"></i>Back to login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="recruiter-column-right">
          <div className="recruiter-widget-wrap">
            <div className="recruiter-image">
              <img
                src="https://bluebridgemanpower.com/wp-content/uploads/2023/03/Group-49335.webp"
                className="attachment-full size-full"
                alt="Group 49335.webp"
                width="656"
                height="736"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
    </div>
    </section>
      </div>
  );
};

export default Postajob;