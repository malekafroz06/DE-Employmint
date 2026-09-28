import mongoose from 'mongoose';

// Sub-schemas get their own timestamps so each row can show a "Created Date".
const educationEntrySchema = new mongoose.Schema({
  level: { type: String, default: '' },
  degreeName: { type: String, default: '' },
  institute: { type: String, default: '' },
  modeOfEducation: { type: String, default: '' },
  percentage: { type: String, default: '' },
  specialization: { type: String, default: '' },
  isHighestEducation: { type: Boolean, default: false }
}, { timestamps: true });

const skillEntrySchema = new mongoose.Schema({
  category: { type: String, default: '' },
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  proficiencyLevel: { type: String, default: '' },
  isCoreSkill: { type: Boolean, default: false }
}, { timestamps: true });

const resumeSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'doc', 'docx']
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  rejected: {
  type: Boolean,
  default: false
  },
  accepted: {
  type: Boolean,
  default: false
  },
  assessmentData: {
    type: Object,
    default: {}
  },
  parsedData: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    skills: [{ type: String }],
    experience: { type: String, default: '' },
    education: { type: String, default: '' },
    summary: { type: String, default: '' }
  },
  // Recruiter-editable candidate profile — filled in / corrected from the
  // "Edit" screen on Candidate Profile (Search Resume). Any field set here
  // takes priority over the value auto-matched from the uploaded CSV.
  candidateProfile: {
    personal: {
      gender: { type: String, default: '' },
      dob: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      maritalStatus: { type: String, default: '' },
      languages: { type: String, default: '' },
      // Mobility — desired work location(s), separate from current city/state above
      preferredLocation: { type: String, default: '' }
    },
    professional: {
      sector: { type: String, default: '' },
      category: { type: String, default: '' },
      product: { type: String, default: '' },
      channel: { type: String, default: '' },
      currentDesignation: { type: String, default: '' },
      currentDepartment: { type: String, default: '' },
      currentCompany: { type: String, default: '' },
      currentCTC: { type: String, default: '' },
      expectedCTC: { type: String, default: '' },
      totalExperience: { type: String, default: '' },
      // BFSI-role-specific experience, distinct from total career experience above
      roleExperience: { type: String, default: '' },
      noticePeriod: { type: String, default: '' },
      // How soon the candidate can join — distinct from Notice Period
      availability: { type: String, default: '' },
      jobChangeStatus: { type: String, default: '' },
      // Simple Active/Passive hiring-status flag, kept separate from jobChangeStatus above
      hiringStatus: { type: String, enum: ['', 'Active', 'Passive'], default: '' }
    },
    skills: [skillEntrySchema],
    education: [educationEntrySchema],
    // Auto-set server-side whenever the recruiter saves any change to this
    // candidate's profile — not user-editable.
    lastVerified: { type: Date, default: null }
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'failed'],
    default: 'uploaded',
    index: true
  },
  metadata: {
    uploadBatch: { type: String, index: true },
    processingNotes: { type: String }
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
resumeSchema.index({ companyId: 1, createdAt: -1 });
resumeSchema.index({ companyId: 1, status: 1 });

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;