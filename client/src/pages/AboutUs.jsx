import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import aboutImage from "../assets/about us.jpeg";
import { ClipboardList, Users, Users2, Zap, BarChart2, Globe, XCircle } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

    {/* Hero Image */}
      <section className="relative overflow-hidden mx-2 sm:mx-4 my-4 sm:my-6 lg:mx-8 lg:my-10 rounded-2xl sm:rounded-3xl border-2 border-gray-300">
        <div className="relative w-full" style={{ paddingBottom: "42%" }}>
          <img
            src={aboutImage}
            alt="About DE Employmint"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: "#020330" }}>
            About <span style={{ color: "#FF0000" }}>DE Employmint</span>
          </h1>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full" style={{ backgroundColor: "#FF0000" }}></div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sm:p-12 space-y-8">

          {/* Intro paragraph */}
          <p className="text-gray-700 text-lg leading-relaxed">
            At <span className="font-semibold" style={{ color: "#020330" }}>DE Employmint</span>, we leverage years of expertise and experience in
            Insurance, Capital Market, Non-Banking Finance and Equity Research recruitment
            to empower staffing agencies, recruitment agencies, solo recruiters, freelance
            and SME to work smarter, close more placements, and scale their business.
          </p>

          {/* Pain points */}
          <div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              We understand the daily challenges recruiters face that slow growth and reduce efficiency:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Scattered tools",
                "Poor candidate databases",
                "Weak client management",
                "Lack of automation",
                "Limited performance visibility",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                >
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Vision quote block */}
          <div className="relative bg-gradient-to-br from-[#020330] to-[#0a0a60] rounded-2xl p-8 sm:p-10 text-white overflow-hidden">
            {/* decorative circle */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-red-500 opacity-10"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-red-400 opacity-10"></div>

            <p className="relative z-10 text-base sm:text-lg leading-relaxed font-light">
              <span className="text-red-400 font-bold text-2xl">"</span>
              <span className="font-semibold text-white">DE Employmint</span> introduces{" "}
              <span className="text-yellow-300 font-semibold">India's first all-in-one recruitment ecosystem</span>{" "}
              for Insurance, Capital Market, Non-Banking Finance and Equity Research recruiters—including
              staffing agencies, recruitment agencies, solo recruiters, freelance and SME without a website.
              <br /><br />
              Our unified platform enables mandate management, candidate tracking, team collaboration,
              automation, and performance analytics, while also helping recruiters build a professional
              digital presence and strengthen their personal or agency brand.
              <br /><br />
              Backed by deep industry expertise, DE Employmint ecosystem empowers recruiters to maximize
              productivity, strengthen client relationships, and turn every mandate into measurable success.
              <span className="text-red-400 font-bold text-2xl">"</span>
            </p>
          </div>

          {/* Feature highlights */}
          <div>
            <h2 className="text-xl font-bold mb-6" style={{ color: "#020330" }}>
              What Our Platform Offers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: ClipboardList, title: "Mandate Management", desc: "Streamline and track every mandate in one place." },
                { icon: Users, title: "Candidate Tracking", desc: "Never lose a candidate with our robust tracking system." },
                { icon: Users2, title: "Team Collaboration", desc: "Work seamlessly across your agency or team." },
                { icon: Zap, title: "Automation", desc: "Automate repetitive tasks and save hours every day." },
                { icon: BarChart2, title: "Performance Analytics", desc: "Get deep insights into your recruitment performance." },
                { icon: Globe, title: "Digital Presence", desc: "Build your brand with a professional online presence." },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#020330] flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm">{feature.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <a
              href="/contact"
              className="inline-block px-10 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: "#FF0000" }}
            >
              Get in Touch with Us
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
