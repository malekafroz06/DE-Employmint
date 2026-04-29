import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ClipboardList, Users, Users2, BarChart2, Zap, Target, Rocket } from "lucide-react";

const VisionMission = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold tracking-widest text-red-500 uppercase mb-3">
            Who We Are
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight" style={{ color: "#020330" }}>
            Our Vision &amp; Mission
          </h1>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full" style={{ backgroundColor: "#FF0000" }}></div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-8">

        {/* Vision Card */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          {/* Card header strip */}
          <div className="h-2 w-full" style={{ background: "linear-gradient(to right, #FF0000, #020330)" }}></div>
          <div className="p-8 sm:p-10 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: "#FF0000" }}>
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "#020330" }}>
                Vision
              </h2>
            </div>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              To be the most trusted and innovative recruitment platform for{" "}
              <span className="font-semibold text-gray-900">Capital Market, Insurance, Equity Research and NBFC</span>{" "}
              sectors, enabling staffing agencies, recruitment agencies, solo recruiters,
              freelance and SME professionals to optimize operations, enhance productivity,
              and achieve sustained business growth.
            </p>
          </div>
        </div>

        {/* Mission Card */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          <div className="h-2 w-full" style={{ background: "linear-gradient(to right, #020330, #FF0000)" }}></div>
          <div className="p-8 sm:p-10 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: "#020330" }}>
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "#020330" }}>
                Mission
              </h2>
            </div>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-8">
              To deliver a unified, technology-driven recruitment ecosystem that addresses the
              critical challenges faced by{" "}
              <span className="font-semibold text-gray-900">Capital Market, Insurance, Equity Research and NBFC</span>{" "}
              recruiters—by providing:
            </p>

            {/* Mission pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: ClipboardList, title: "Efficient Mandate Management", desc: "Streamline every mandate from start to close." },
                { icon: Users, title: "Intelligent Candidate Tracking", desc: "Never lose a candidate with smart tracking." },
                { icon: Users2, title: "Seamless Collaboration", desc: "Work effortlessly across your team or agency." },
                { icon: BarChart2, title: "Performance Analytics", desc: "Deep insights to drive better decisions." },
                { icon: Zap, title: "Process Automation", desc: "Automate repetitive tasks and save time." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-lg bg-[#020330] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              —thereby empowering recruiters to{" "}
              <span className="font-semibold text-gray-900">maximize placements</span>,
              strengthen client relationships, and scale their business with{" "}
              <span className="font-semibold text-gray-900">precision and transparency</span>.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <a
            href="/contact"
            className="inline-block px-10 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: "#FF0000" }}
          >
            Get in Touch
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VisionMission;
