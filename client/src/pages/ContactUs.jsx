import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import contactImage from "../assets/contact us.jpeg";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    workEmail: "",
    phoneNumber: "",
    talentsNeeded: "",
    roles: "",
    budget: "",
    additionalInfo: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    await new Promise((res) => setTimeout(res, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Image */}
      <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden">
        <img
          src={contactImage}
          alt="Contact Us"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contact Section */}
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Talk to an Expert
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
            Finding top talent is like finding a needle in a haystack. We've
            spent years perfecting it. Let us help you hire faster and smarter.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
            <span className="text-blue-700 font-bold text-sm">in</span>
            <div>
              <p className="text-xs text-gray-500 leading-none">LinkedIn</p>
              <p className="font-bold text-gray-800 text-sm">1 Million+</p>
              <p className="text-xs text-gray-400">Followers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
            <span className="text-orange-500 font-bold text-sm">★★★★★</span>
            <div>
              <p className="text-xs text-gray-500 leading-none">Clutch</p>
              <p className="font-bold text-gray-800 text-sm">126+</p>
              <p className="text-xs text-gray-400">reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
            <span className="text-green-500 text-lg">✓</span>
            <p className="text-sm text-gray-700 font-medium">Hire 10x faster</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
            <span className="text-green-500 text-lg">✓</span>
            <p className="text-sm text-gray-700 font-medium">Work with top talents</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
            <span className="text-green-500 text-lg">✓</span>
            <p className="text-sm text-gray-700 font-medium">Get twice the work done</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#f5f0e8] rounded-2xl shadow-lg p-6 sm:p-10">
          {submitted ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Thank you for reaching out!
              </h3>
              <p className="text-gray-500">
                Our team will get back to you shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    fullName: "",
                    workEmail: "",
                    phoneNumber: "",
                    talentsNeeded: "",
                    roles: "",
                    budget: "",
                    additionalInfo: "",
                  });
                }}
                className="mt-6 px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-300"
                style={{ backgroundColor: "#FF0000" }}
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full name *"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                />
                <input
                  type="email"
                  name="workEmail"
                  value={formData.workEmail}
                  onChange={handleChange}
                  placeholder="Work email *"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Phone number *"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                />
                <input
                  type="number"
                  name="talentsNeeded"
                  value={formData.talentsNeeded}
                  onChange={handleChange}
                  placeholder="How many talents are you looking to hire? *"
                  required
                  min="1"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                />
                <input
                  type="text"
                  name="roles"
                  value={formData.roles}
                  onChange={handleChange}
                  placeholder="What are these role(s)? *"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                />
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="What's your budget? *"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                />
              </div>

              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Any additional information?"
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 transition resize-none"
              />

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-12 py-3 rounded-xl font-semibold text-gray-900 text-sm transition-all duration-300 hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#F5C518" }}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📧</div>
            <h4 className="font-semibold text-gray-800 mb-1">Email Us</h4>
            <p className="text-sm text-gray-500">support@deemploymint.com</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📞</div>
            <h4 className="font-semibold text-gray-800 mb-1">Call Us</h4>
            <p className="text-sm text-gray-500">+91 00000 00000</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📍</div>
            <h4 className="font-semibold text-gray-800 mb-1">Visit Us</h4>
            <p className="text-sm text-gray-500">India</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;
