import mongoose from 'mongoose';

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