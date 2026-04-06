import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Search, 
  LineChart, 
  Database,
  Calculator,
  Shield,
  Car,
  Home,
  Building2,
  PieChart,
  Target,
  Briefcase
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import Navbar from './Navbar';
import Footer from './Footer'; 

const JobCategories = () => {
  const { jobs, setSearchFilter } = useContext(AppContext);
  const navigate = useNavigate();

  // Predefined categories
  const predefinedJobCategories = [
    "Equity Broking",
    "Commodity Broking", 
    "Currency Broking",
    "Fundamental Research",
    "Technical Research",
    "Data Analysis",
    "Quant Analysis",
    "Life Insurance",
    "General Insurance",
    "Asset Finance",
    "Loan Companies",
    "Microfinance",
    "MFI",
    "Housing Finance Co. (HFC)",
    "Discretionary Portfolio Management",
    "Non-Discretionary Advisory"
  ];

  const categories = [
    {
      id: 1, name: "Equity Broking", icon: TrendingUp, designation: "Equity Broking",
      products: ["Equity", "Commodity", "Currency", "Mutual Funds", "Insurance"]
    },
    {
      id: 2, name: "Commodity Broking", icon: BarChart3, designation: "Commodity Broking",
      products: ["Equity", "Commodity", "Currency", "Mutual Funds", "Insurance"]
    },
    {
      id: 3, name: "Currency Broking", icon: DollarSign, designation: "Currency Broking",
      products: ["Equity", "Commodity", "Currency", "Mutual Funds", "Insurance"]
    },
    {
      id: 4, name: "Fundamental Research", icon: Search, designation: "Fundamental Research",
      products: ["Buy Side", "Sell Side"]
    },
    {
      id: 5, name: "Technical Research", icon: LineChart, designation: "Technical Research",
      products: ["Derivative", "Non Derivative"]
    },
    {
      id: 6, name: "Data Analysis", icon: Database, designation: "Data Analysis",
      products: ["Quant Modeling", "Algorithmic Trading Strategies"]
    },
    {
      id: 7, name: "Quant Analysis", icon: Calculator, designation: "Quant Analysis",
      products: ["Quant Modeling"]
    },
    {
      id: 8, name: "Life Insurance", icon: Shield, designation: "Life Insurance",
      products: ["Term Plans", "Endowment Plan", "ULIPs"]
    },
    {
      id: 9, name: "General Insurance", icon: Car, designation: "General Insurance",
      products: ["Motor Insurance", "Health Insurance", "Travel Insurance", "Property Insurance", "Fire Insurance", "Marine Insurance", "Burglory Insurance"]
    },
    {
      id: 10, name: "Asset Finance Company (AFC)", icon: Building2, designation: "Asset Finance",
      products: ["Commercial Vehicle Loans", "Construction Equipment Loans", "Tractor Loan"]
    },
    {
      id: 11, name: "Loan Company (LC)", icon: DollarSign, designation: "Loan Companies",
      products: ["Personal Loans", "Business Loans", "MSME Loans"]
    },
    {
      id: 12, name: "Microfinance Institution (MFI)", icon: Home, designation: "Microfinance",
      products: ["Group Loans", "Small Ticket Loans", "Micro Loans", "Women Group Lending", "Rural Credit"]
    },
    {
      id: 13, name: "Housing Finance Co. (HFC)", icon: Home, designation: "Housing Finance Co. (HFC)",
      products: ["Home Loans", "Loan Against Property (LAP)", "Affordable Housing Loans"]
    },
    {
      id: 14, name: "Discretionary Portfolio Management", icon: PieChart, designation: "Discretionary Portfolio Management",
      products: ["Buy Side", "Sell Side", "Quant Modeling"]
    },
    {
      id: 15, name: "Algo Trading", icon: Target, designation: "Non-Discretionary Advisory",
      products: ["Algorithmic Trading Strategies"]
    },
    {
      id: 16, name: "Other Categories", icon: Briefcase, designation: "Other", isOther: true,
      products: []
    }
  ];

  // Function to check if a job is "Other" (not in predefined categories)
  const isOtherJob = (job) => {
    return !predefinedJobCategories.includes(job.jobcategory) && 
           !predefinedJobCategories.includes(job.designation);
  };

  // Function to get job count for a specific category

  // Function to handle category click
  const handleCategoryClick = (designation, isOther = false) => {
    // Clear search filters first
    setSearchFilter({ title: "", location: "" });
    
    if (isOther) {
      // For "Other", navigate with "Other" selection
      navigate('/JobListing', { 
        state: { 
          selectedCategory: "Other",
          fromCategoryPage: true 
        } 
      });
    } else {
      // Navigate to JobListing with the selected category
      navigate('/JobListing', { 
        state: { 
          selectedCategory: designation,
          fromCategoryPage: true 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <Navbar/>
      <div className="bg-white py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-medium tracking-wider mb-4 text-red-600">
            JOB CATEGORIES
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#022030" }}>
            Find Jobs by Categories
          </h1>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const rawCount = jobs.filter(job =>
                category.isOther ? isOtherJob(job) : (job.designation === category.designation || job.jobcategory === category.designation)
              ).length;

              return (
                <div
                  key={category.id}
                  className={`bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${
                    category.isOther ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                  onClick={() => handleCategoryClick(category.designation, category.isOther)}
                >
                  {/* Top row: Icon + Job count badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ${
                      category.isOther ? 'bg-blue-500' : 'bg-[#FF0000]'
                    }`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>

                    {/* Job count circle */}
                    <div className="w-14 h-14 rounded-full border-2 border-gray-200 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold leading-none" style={{ color: "#022030" }}>
                        {rawCount > 0 ? rawCount : '0'}
                      </span>
                      <span className="text-xs text-gray-400 leading-none mt-0.5">Jobs</span>
                    </div>
                  </div>

                  {/* Category Name */}
                  <h3 className="text-lg font-bold mb-3" style={{ color: "#022030" }}>
                    {category.name}
                  </h3>

                  {/* Products */}
                  {category.products && category.products.length > 0 && (
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: "#022030" }}>Products</p>
                      <ul className="space-y-0.5">
                        {category.products.map((product, idx) => (
                          <li key={idx} className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-400 inline-block flex-shrink-0"></span>
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
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default JobCategories;