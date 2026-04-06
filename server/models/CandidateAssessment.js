import mongoose from 'mongoose';

const candidateAssessmentSchema = new mongoose.Schema({
  // Basic Information
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  candidateEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  candidatePhone: {
    type: String,
    required: false,
    trim: true
  },
  
  // Step 1: Consultancy Questions
  consultancy: {
    type: String,
    trim: true
  },
  financialStatus: {
    type: String,
    enum: [
      "Employment & Income",
      "Household Dependency", 
      "Liabilities / Commitments",
      "Risk Appetite (Financial Comfort Zone)"
    ]
  },
  dailyCommute: {
    type: String,
    enum: [
      "By Bus",
      "By Two Wheeler",
      "By Four Wheeler", 
      "By Sharing with Friend",
      "By Auto"
    ]
  },
  aspirations: {
    type: String,
    enum: [
      "Career Growth & Development",
      "Work Environment & Culture",
      "Compensation & Benefits",
      "Job Role & Responsibilities", 
      "Location & Commute",
      "Company-Related Factors",
      "Personal Reasons"
    ]
  },
  moneyAttitude: {
    type: String,
    enum: [
      "Salary is for survival, growth is in incentives.",
      "work for passion first, money second.",
      "Money is secondary, work-life balance is primary."
    ]
  },
  loyaltyBehavior: {
    type: String,
    enum: [
      "I stay loyal if the company values my growth.",
      "I prefer long-term stability over frequent job changes.",
      "I am loyal to leaders, not just organizations.",
      "I am loyal to opportunities, not just companies."
    ]
  },
  workStyle: {
    type: String,
    enum: [
      "I prefer structured processes and clear guidelines.",
      "I like working independently with minimal supervision",
      "I am deadline-driven and work well under pressure.",
      "I like multitasking across different projects.",
      "I prioritize speed and efficiency over perfection.",
      "Prefers fieldwork",
      "Prefers Office Work"
    ]
  },
  pressureHandling: {
    type: String,
    enum: [
      "Calmness under stress: Not showing frustration even when targets are tight or clients are difficult.",
      "Prioritization skills: Handling multiple tasks and clients efficiently.",
      "Problem-solving mindset: Quickly finding solutions instead of panicking.",
      "Resilience: Bouncing back from failures, rejections, or missed opportunities.",
      "Decision-making: Making accurate decisions quickly, without overthinking"
    ]
  },
  roleClarityNeed: {
    type: String,
    enum: [
      "Understanding Responsibilities: Knowing exactly what tasks you are expected to perform daily, weekly, and monthly.",
      "Knowing Key Metrics: Understanding targets, KPIs, and performance expectations.",
      "Decision Boundaries: Knowing what decisions you can make independently and what requires approval.",
      "Reporting Structure: Clear knowledge of who you report to and who reports to you (if applicable).",
      "Career Path: Awareness of promotion opportunities and skills needed for growth."
    ]
  },
  
  // Step 2: HR Questions
  fear1: {
    type: String,
    enum: [
      "Fear of failing again like last job",
      "Fear of resume instability",
      "Fear of lack of field support", 
      "Fear of blame for advisor failure"
    ]
  },
  motivation1: {
    type: String,
    enum: [
      "Wants unlimited earning via incentives",
      "Wants social recognition",
      "Wants to outperform peers",
      "Wants better life for family",
      "Wants public appreciation"
    ]
  },
  challenge1: {
    type: String,
    enum: [
      "Advisor retention",
      "No field support", 
      "Manual processes",
      "Delayed incentives",
      "Stuck career path"
    ]
  },
  powerLanguage1: {
    type: String,
    enum: [
      "Your incentives, your speed — no cap",
      "Weekly advisor performance reports in app",
      "Promotion to TL in 6 months",
      "We never delay commissions", 
      "Field support guaranteed"
    ]
  },
  companyPriority1: {
    type: String,
    enum: [
      "Stable payout structure",
      "Lead support + onboarding",
      "Supportive manager",
      "Transparent promotion path",
      "Modern tools (POSP App, CRM)"
    ]
  },
  
  // Step 3: Manager Questions
  targets: {
    type: String,
    enum: [
      "I see targets as motivation to push beyond limits.",
      "I prefer realistic and achievable targets.",
      "I thrive under aggressive, high-pressure targets.",
      "I focus on consistent performance rather than chasing big numbers.",
      "I value team-based targets more than individual ones",
      "I feel stressed when targets are unrealistic.",
      "I see targets as guidance, not as pressure."
    ]
  },
  references: {
    type: String,
    trim: true
  },
  softwares: {
    type: String,
    enum: [
      "Basic Awareness",
      "Intermediate Awareness",
      "Advanced Awareness", 
      "Specialized Awareness",
      "Expert / Tech-Savvy"
    ]
  },
  productKnowledge: {
    type: String,
    enum: [
      "Basic Awareness",
      "Intermediate Awareness",
      "Advanced Awareness",
      "Specialized Awareness", 
      "Expert / Tech-Savvy"
    ]
  },
  sourceOfRevenue: {
    type: String,
    enum: [
      "Personal Network (Warm Leads)",
      "Cold Calling & Prospecting",
      "Corporate Tie-Ups & Partnerships",
      "Events & Seminars",
      "Digital Marketing",
      "Channel Partners",
      "Networking & Community Outreach"
    ]
  },
  
  // Remarks per role
  remarks: [
    {
      role: { type: String, trim: true },
      text: { type: String, trim: true },
      submittedAt: { type: Date, default: Date.now }
    }
  ],

  // Assessment Metadata
  assessmentStatus: {
    type: String,
    enum: ['incomplete', 'completed'],
    default: 'incomplete'
  },
  
  // Last Contacted Date - tracks when assessment was last submitted/updated
  lastContactedDate: {
    type: Date,
    default: Date.now
  },  
   
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for better query performance
candidateAssessmentSchema.index({ candidateEmail: 1 });
candidateAssessmentSchema.index({ submittedAt: -1 });
candidateAssessmentSchema.index({ assessmentStatus: 1 });
candidateAssessmentSchema.index({ lastContactedDate: -1 });
// Pre-save middleware to update lastUpdated and lastContactedDate
candidateAssessmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  this.lastContactedDate = new Date(); // Update last contacted date on every save
  next();
});

const CandidateAssessment = mongoose.model('CandidateAssessment', candidateAssessmentSchema);
export default CandidateAssessment;