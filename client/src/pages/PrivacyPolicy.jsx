import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FileText, Users, ShieldCheck, Ban, Lock, CreditCard,
  AlertTriangle, Scale, UserX, Zap, Gavel, RefreshCw,
  Mail, UserCheck, Briefcase, Cookie, Link2
} from "lucide-react";

const PrivacyPolicy = () => {
  const termsSections = [
    {
      icon: Gavel,
      number: "1",
      title: "Legal Agreement",
      text: "These Terms and Conditions constitute a legally binding agreement between the user (User) and the Firm. By accessing, registering, or using the Platform, the User agrees to be bound by these Terms. If the User does not agree, they must immediately discontinue use of the Platform.",
      pillars: null,
    },
    {
      icon: Briefcase,
      number: "2",
      title: "Nature of the Platform",
      text: "The Platform is a technology-based intermediary operated by the Firm that facilitates interaction between job seekers and recruiters. The Firm does not act as an employer, recruiter, agent, consultant, or advisor and does not participate in any hiring decisions, employment contracts, or negotiations.",
      pillars: [
        { label: "No Employer Role", desc: "The Firm does not participate in hiring decisions or employment contracts." },
        { label: "No Guarantees", desc: "The Firm does not guarantee job placement, interview calls, or hiring outcomes." },
        { label: "At User's Risk", desc: "All interactions and transactions are solely between Users at their own risk." },
      ],
    },
    {
      icon: UserCheck,
      number: "3",
      title: "User Eligibility & Account",
      text: "The User represents that they are at least 18 years of age and legally competent to enter into binding contracts. The User agrees to provide accurate, complete, and updated information during registration and to maintain the confidentiality of their login credentials. The Firm shall not be liable for any unauthorized use of the User's account.",
      pillars: null,
    },
    {
      icon: Users,
      number: "4",
      title: "User Obligations",
      text: "The User agrees to use the Platform in compliance with applicable laws and these Terms.",
      pillars: [
        { label: "Lawful Use", desc: "Use the Platform in full compliance with applicable laws and these Terms." },
        { label: "Accurate Content", desc: "Do not upload false, misleading, defamatory, or unlawful content." },
        { label: "Verification Duty", desc: "Users must verify the authenticity of any job opportunity or recruiter before engaging." },
      ],
    },
    {
      icon: Briefcase,
      number: "5",
      title: "Recruiter & Candidate Responsibility",
      text: "Recruiters are solely responsible for the accuracy and legality of job postings. Candidates are solely responsible for the accuracy of their resumes and personal details. The Firm does not verify the authenticity of either party and shall not be responsible for any misrepresentation, fraud, or dispute arising between Users.",
      pillars: null,
    },
    {
      icon: Ban,
      number: "6",
      title: "Prohibited Use",
      text: "The User shall not engage in any activity that includes but is not limited to fraud, impersonation, data scraping, spamming, hacking, or violation of any law. The Platform may, at its sole discretion, suspend or terminate access for any such violation without prior notice.",
      pillars: null,
    },
    {
      icon: Lock,
      number: "7",
      title: "Data Protection & Privacy",
      text: "The Firm collects and processes personal data in accordance with its Privacy Policy and applicable laws. By using the Platform, the User provides explicit consent for such data processing and sharing with relevant parties for recruitment purposes.",
      pillars: [
        { label: "Explicit Consent", desc: "Use of the Platform constitutes consent for data processing and sharing for recruitment." },
        { label: "Third-Party Links", desc: "The Firm is not responsible for the privacy practices of external websites linked from the Platform." },
        { label: "User Advisory", desc: "Users should review the privacy policies of any third-party websites before sharing personal information." },
      ],
    },
    {
      icon: CreditCard,
      number: "8",
      title: "Payments & Refunds",
      text: "All payments made for services on the Platform are non-refundable unless explicitly stated otherwise. The Firm does not guarantee any outcomes from paid services and shall not be liable for dissatisfaction or lack of results.",
      pillars: null,
    },
    {
      icon: AlertTriangle,
      number: "9",
      title: "Disclaimer of Warranties",
      text: "The Platform is provided on an 'as is' and 'as available' basis. The Firm makes no warranties, express or implied, regarding the accuracy, reliability, availability, or suitability of the Platform or its services.",
      pillars: null,
    },
    {
      icon: ShieldCheck,
      number: "10",
      title: "Limitation of Liability",
      text: "To the maximum extent permitted by law, the Firm shall not be liable for any direct, indirect, incidental, consequential, or special damages arising out of or in connection with the use of the Platform. In any event, the total liability of the Firm shall not exceed the amount paid by the User, if any, or ₹500, whichever is lower.",
      pillars: null,
    },
    {
      icon: FileText,
      number: "11",
      title: "Indemnification",
      text: "The User agrees to indemnify, defend, and hold harmless the Firm, its partners, employees, and affiliates from any claims, damages, losses, liabilities, or expenses arising out of the User's use of the Platform, violation of these Terms, or interaction with other Users.",
      pillars: null,
    },
    {
      icon: UserX,
      number: "12",
      title: "Termination",
      text: "The Firm reserves the right to suspend or terminate any User account, remove content, or restrict access at its sole discretion without prior notice, particularly in cases of violation of these Terms or applicable laws.",
      pillars: null,
    },
    {
      icon: Zap,
      number: "13",
      title: "Force Majeure",
      text: "The Firm shall not be liable for any failure or delay in performance due to events beyond its reasonable control, including but not limited to natural disasters, technical failures, or government actions.",
      pillars: null,
    },
    {
      icon: Scale,
      number: "14",
      title: "Governing Law & Jurisdiction",
      text: "These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts located in Anand, Gujarat.",
      pillars: null,
    },
    {
      icon: RefreshCw,
      number: "15",
      title: "Modifications",
      text: "The Firm reserves the right to modify these Terms at any time. Continued use of the Platform constitutes acceptance of the revised Terms.",
      pillars: null,
    },
  ];

  const policySections = [
    {
      icon: Lock,
      title: "Privacy Policy",
      gradient: "linear-gradient(to right, #FF0000, #020330)",
      iconBg: "#FF0000",
      text: "The Firm collects personal data including name, contact details, employment information, and technical data for the purpose of providing recruitment services. Such data is processed based on the User's consent and legitimate use for job matching and communication. The Firm may share such data with recruiters, service providers, and authorities where required by law. Users have the right to access, correct, or request deletion of their data. The Firm implements reasonable security measures but does not guarantee absolute protection.",
      pillars: null,
    },
    {
      icon: UserCheck,
      title: "Candidate Terms",
      gradient: "linear-gradient(to right, #020330, #FF0000)",
      iconBg: "#020330",
      text: "Candidates acknowledge that the Platform is only a facilitator operated by the Firm and does not guarantee employment. Candidates are responsible for verifying the authenticity of recruiters and job offers. The Firm shall not be liable for any employment decisions, fraud, or financial losses arising from interactions on the Platform.",
      pillars: null,
    },
    {
      icon: AlertTriangle,
      title: "Disclaimer",
      gradient: "linear-gradient(to right, #FF0000, #020330)",
      iconBg: "#FF0000",
      text: "The Platform does not guarantee job placement, interview opportunities, or employment outcomes. The Firm does not verify all job postings or recruiters and shall not be responsible for any loss, damage, or dispute arising from user interactions. Users engage with the Platform entirely at their own risk.",
      pillars: null,
    },
    {
      icon: CreditCard,
      title: "Refund Policy",
      gradient: "linear-gradient(to right, #020330, #FF0000)",
      iconBg: "#020330",
      text: "All payments made on the Platform are non-refundable except in cases of duplicate transactions or technical errors, subject to the Firm's discretion. Approved refunds shall be processed within 7 to 15 working days.",
      pillars: null,
    },
    {
      icon: FileText,
      title: "User Consent Clause",
      gradient: "linear-gradient(to right, #FF0000, #020330)",
      iconBg: "#FF0000",
      text: "By registering on the Platform, the User confirms that they have read and agreed to the Terms and Conditions, Privacy Policy, and Refund Policy, and consent to the collection and processing of their personal data in accordance with applicable laws, including the Digital Personal Data Protection Act, 2023.",
      pillars: null,
    },
    {
      icon: Link2,
      title: "Third-Party Links",
      gradient: "linear-gradient(to right, #020330, #FF0000)",
      iconBg: "#020330",
      text: "Our website may contain links to third-party sites. We are not responsible for their privacy practices. Users are encouraged to review the privacy policies of any external sites they visit.",
      pillars: null,
    },
    {
      icon: Cookie,
      title: "Cookies & Tracking Technologies",
      gradient: "linear-gradient(to right, #FF0000, #020330)",
      iconBg: "#FF0000",
      text: "We use cookies to enhance your browsing experience, analyze site traffic, and deliver targeted advertisements. You can control cookie settings through your browser.",
      pillars: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative overflow-hidden mx-2 sm:mx-4 my-4 sm:my-6 lg:mx-8 lg:my-10 rounded-2xl sm:rounded-3xl border-2 border-gray-300">
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            minHeight: "220px",
            background: "linear-gradient(135deg, #020330 0%, #0a0a4a 40%, #1a0000 70%, #FF0000 100%)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="absolute top-6 left-10 w-48 h-48 rounded-full bg-red-600 opacity-10 blur-3xl"></div>
            <div className="absolute bottom-4 right-16 w-64 h-64 rounded-full bg-blue-900 opacity-20 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full bg-white opacity-5 blur-2xl"></div>
          </div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.08) 40px, rgba(255,255,255,0.08) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.08) 40px, rgba(255,255,255,0.08) 41px)",
            }}
          ></div>
          <div className="relative z-10 text-center px-6 py-12 sm:py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-lg" style={{ backgroundColor: "#FF0000" }}>
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-red-200 text-sm sm:text-base max-w-xl mx-auto font-light">
              Please read these terms carefully before using the DE employmint platform.
            </p>
            <p className="text-gray-400 text-xs mt-4">Firm: DE employmint &nbsp;|&nbsp; Last Updated: 01 April 2026</p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-8">

        {/* Terms & Conditions Sections */}
        {termsSections.map((section, index) => (
          <div key={section.number} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            <div
              className="h-2 w-full"
              style={{
                background: index % 2 === 0
                  ? "linear-gradient(to right, #FF0000, #020330)"
                  : "linear-gradient(to right, #020330, #FF0000)",
              }}
            ></div>
            <div className="p-8 sm:p-10 md:p-12">
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: index % 2 === 0 ? "#FF0000" : "#020330" }}
                >
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#020330" }}>
                  {section.title}
                </h2>
              </div>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">{section.text}</p>
              {section.pillars && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {section.pillars.map((p) => (
                    <div key={p.label} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "#FF0000" }}></div>
                      <div>
                        <p className="font-semibold text-gray-800 text-xs mb-0.5">{p.label}</p>
                        <p className="text-gray-500 text-xs leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Contact Section */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          <div className="h-2 w-full" style={{ background: "linear-gradient(to right, #FF0000, #020330)" }}></div>
          <div className="p-8 sm:p-10 md:p-12">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: "#FF0000" }}>
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#020330" }}>Contact</h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-5">
              For any queries or grievances, users may contact us at:
            </p>
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-5 max-w-sm">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#FF0000" }}></div>
              <div>
                <p className="font-semibold text-gray-800 text-sm mb-0.5">Email</p>
                <a href="mailto:info@demploymint.com" className="text-xs font-medium hover:underline" style={{ color: "#FF0000" }}>
                  info@demploymint.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 py-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-2">Additional Policies</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Policy Sections */}
        {policySections.map((section) => (
          <div key={section.title} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            <div className="h-2 w-full" style={{ background: section.gradient }}></div>
            <div className="p-8 sm:p-10 md:p-12">
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: section.iconBg }}
                >
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#020330" }}>
                  {section.title}
                </h2>
              </div>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{section.text}</p>
            </div>
          </div>
        ))}

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

export default PrivacyPolicy;