import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  BarChart2,
  PieChart,
  Wallet,
  Gem,
  Landmark,
  Building2,
  DollarSign,
  Home,
  Coins,
  ShoppingCart,
  Shield,
  Car,
  Search,
  LineChart,
  Calculator,
  Bot,
  Briefcase,
  Activity
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import Navbar from './Navbar';
import Footer from './Footer';
import categoriesHero from '../assets/job categories.jpeg';

const JobCategories = () => {
  const { jobs, setSearchFilter } = useContext(AppContext);
  const navigate = useNavigate();

  const predefinedJobCategories = [
    "Stock Market",
    "Asset Management",
    "Portfolio Management",
    "Wealth Management",
    "Alternative Investment",
    "Investment Banking",
    "Asset Finance Company (AFC)",
    "Loan Company (LC)",
    "Microfinance Institution (MFI)",
    "Housing Finance Company (HFC)",
    "Gold Loan NBFC",
    "Retail NBFC (Consumer Finance)",
    "Life Insurance",
    "General Insurance",
    "Fundamental Analysis",
    "Technical Analysis",
    "Quant Analysis",
    "Algo Trading",
  ];

  const sections = [
    {
      label: "Capital Market",
      sectionIcon: BarChart2,
      categories: [
        {
          id: 1, name: "Stock Market", icon: TrendingUp, designation: "Stock Market",
          products: ["Equity", "Commodity", "Currency"]
        },
        {
          id: 2, name: "Asset Management", icon: BarChart3, designation: "Asset Management",
          products: ["Mutual Fund", "SIP", "ETF"]
        },
        {
          id: 3, name: "Portfolio Management", icon: PieChart, designation: "Portfolio Management",
          products: ["Discretionary Portfolio Management", "Non-Discretionary Portfolio Management"]
        },
        {
          id: 4, name: "Wealth Management", icon: Wallet, designation: "Wealth Management",
          products: ["Wealth Planning", "Investment Advisory"]
        },
        {
          id: 5, name: "Alternative Investment", icon: Gem, designation: "Alternative Investment",
          products: ["Private Equity", "Venture Capital", "Hedge Funds"]
        },
        {
          id: 6, name: "Investment Banking", icon: Landmark, designation: "Investment Banking",
          products: ["IPO Advisory", "M&A", "Capital Raising", "Debt Syndication"]
        },
      ]
    },
    {
      label: "NBFC Sector",
      sectionIcon: Landmark,
      categories: [
        {
          id: 7, name: "Asset Finance Company (AFC)", icon: Building2, designation: "Asset Finance Company (AFC)",
          products: ["Commercial Vehicle Loans", "Construction Equipment Loans", "Tractor Loan"]
        },
        {
          id: 8, name: "Loan Company (LC)", icon: DollarSign, designation: "Loan Company (LC)",
          products: ["Personal Loans", "Business Loans", "MSME Loans"]
        },
        {
          id: 9, name: "Microfinance Institution (MFI)", icon: Home, designation: "Microfinance Institution (MFI)",
          products: ["Group Loans", "Small Ticket Loans", "Micro Loans", "Women Group Lending", "Rural Credit"]
        },
        {
          id: 10, name: "Housing Finance Company (HFC)", icon: Home, designation: "Housing Finance Company (HFC)",
          products: ["Home Loans", "Loan Against Property (LAP)", "Affordable Housing Loans"]
        },
        {
          id: 11, name: "Gold Loan NBFC", icon: Coins, designation: "Gold Loan NBFC",
          products: ["Gold Loans (Secured Loans)"]
        },
        {
          id: 12, name: "Retail NBFC (Consumer Finance)", icon: ShoppingCart, designation: "Retail NBFC (Consumer Finance)",
          products: ["Consumer Durable Loans"]
        },
      ]
    },
    {
      label: "Insurance Sector",
      sectionIcon: Shield,
      categories: [
        {
          id: 13, name: "Life Insurance", icon: Shield, designation: "Life Insurance",
          products: ["Term Plans", "Endowment Plan", "ULIPs"]
        },
        {
          id: 14, name: "General Insurance", icon: Car, designation: "General Insurance",
          products: ["Motor Insurance", "Health Insurance", "Travel Insurance", "Property Insurance", "Fire Insurance", "Marine Insurance", "Burglary Insurance"]
        },
      ]
    },
    {
      label: "Prop Trading",
      sectionIcon: Activity,
      categories: [
        {
          id: 15, name: "Fundamental Analysis", icon: Search, designation: "Fundamental Analysis",
          products: ["Buy Side", "Sell Side"]
        },
        {
          id: 16, name: "Technical Analysis", icon: LineChart, designation: "Technical Analysis",
          products: ["Derivative", "Non-Derivative"]
        },
        {
          id: 17, name: "Quant Analysis", icon: Calculator, designation: "Quant Analysis",
          products: ["Quant Modeling"]
        },
        {
          id: 18, name: "Algo Trading", icon: Bot, designation: "Algo Trading",
          products: ["Algorithmic Trading Strategies"]
        },
      ]
    },
  ];

  const isOtherJob = (job) => {
    return !predefinedJobCategories.includes(job.jobcategory) &&
           !predefinedJobCategories.includes(job.designation);
  };

  const handleCategoryClick = (designation, isOther = false) => {
    setSearchFilter({ title: "", location: "" });
    navigate('/JobListing', {
      state: {
        selectedCategory: isOther ? "Other" : designation,
        fromCategoryPage: true
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero with text overlay */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
        <img
          src={categoriesHero}
          alt="Job Categories"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: "#ff0000" }}>
            JOB CATEGORIES
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Find Jobs by Categories
          </h1>
        </div>
      </div>

      {/* Sections */}
      <div className="py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-14">

          {sections.map((section) => {
            return (
              <div key={section.label}>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#022030" }}
                  >
                    <section.sectionIcon className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#022030" }}>
                    {section.label}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {section.categories.map((category) => {
                    const IconComponent = category.icon;
                    const jobCount = jobs.filter(job =>
                      job.designation === category.designation || job.jobcategory === category.designation
                    ).length;

                    return (
                      <div
                        key={category.id}
                        className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                        style={{ border: "1px solid #e5e7eb" }}
                        onClick={() => handleCategoryClick(category.designation)}
                      >
                        {/* Top row: Icon + Job count */}
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundColor: "#022030" }}
                          >
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div
                            className="w-12 h-12 rounded-full flex flex-col items-center justify-center"
                            style={{ border: "2px solid #022030" }}
                          >
                            <span className="text-sm font-bold leading-none" style={{ color: "#022030" }}>
                              {jobCount}
                            </span>
                            <span className="text-xs leading-none mt-0.5" style={{ color: "#022030" }}>Jobs</span>
                          </div>
                        </div>

                        {/* Name */}
                        <h3 className="text-base font-bold mb-3" style={{ color: "#022030" }}>
                          {category.name}
                        </h3>

                        {/* Products */}
                        {category.products.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#ff0000" }}>
                              Products
                            </p>
                            <ul className="space-y-1">
                              {category.products.map((product, idx) => (
                                <li key={idx} className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <span
                                    className="w-1 h-1 rounded-full inline-block flex-shrink-0"
                                    style={{ backgroundColor: "#ff0000" }}
                                  />
                                  {product}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Other Categories card */}
          <div
            className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex items-center gap-4 max-w-sm"
            style={{ border: "1px solid #022030" }}
            onClick={() => handleCategoryClick("Other", true)}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#022030" }}
            >
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: "#022030" }}>Other Categories</h3>
              <p className="text-xs mt-0.5" style={{ color: "#ff0000" }}>
                {jobs.filter(isOtherJob).length} Jobs
              </p>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JobCategories;