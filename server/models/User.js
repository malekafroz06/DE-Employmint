import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Clerk user ID
  name: { type: String, required: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    default: ''
  },
  resume: { type: String, default: '' },
  image: {
    type: String,
    required: [true, 'Image is required'],
    default: '/default-avatar.png'
  },

  // ── Personal Details ────────────────────────────────────────────
  fullName:      { type: String, default: '' },
  gender:        { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  dob:           { type: Date,   default: null },
  mobileNo:      { type: String, default: '' },
  emailId:       { type: String, default: '' },
  city:          { type: String, default: '' },
  state:         { type: String, default: '' },
  languages:     { type: String, default: '' },
  maritalStatus: { type: String, default: '' },

  // ── Professional Details ────────────────────────────────────────
  currentDesignation: { type: String, default: '' },
  currentDepartment:  { type: String, default: '' },
  currentCTC:         { type: String, default: '' },
  noticePeriod:       { type: String, default: '' },
  totalExperience:    { type: String, default: '' },
  roleType:           { type: String, default: 'Full Time' },
  jobChangeStatus:    { type: String, default: '' },
  sector:             { type: String, default: '' },
  category:           { type: String, default: '' },
  otherSector:        { type: String, default: '' },
  otherCategory:      { type: String, default: '' },

  // ── NEW: Product & Channel ──────────────────────────────────────
  jobCategory:      { type: String, default: '' },
  otherJobCategory: { type: String, default: '' },
  selectedProducts: { type: String, default: '' }, // stored as comma-separated string
  jobChannel:       { type: String, default: '' },
  otherJobChannel:  { type: String, default: '' },

  // ── Deprecated — kept only for backward compatibility ───────────
  // Do NOT use these in new code; they will be removed in a future migration
  linkedinId:  { type: String, default: '' },
  instagramId: { type: String, default: '' },
  facebookId:  { type: String, default: '' },
  expectedCTC: { type: String, default: '' },
  firstName:   { type: String, default: '' },
  middleName:  { type: String, default: '' },
  surname:     { type: String, default: '' },

}, {
  timestamps: true,
  strict: false // keeps any extra fields that arrive from older clients
});

// Virtual: always return a sensible display name regardless of which fields are set
userSchema.virtual('displayName').get(function () {
  if (this.fullName) return this.fullName;
  if (this.firstName || this.surname) {
    return `${this.firstName || ''} ${this.middleName || ''} ${this.surname || ''}`.trim();
  }
  return this.name;
});

// Pre-save: keep fullName ↔ firstName/surname in sync for any legacy code still reading those
userSchema.pre('save', function (next) {
  if (this.fullName && !this.firstName && !this.surname) {
    const parts = this.fullName.trim().split(/\s+/);
    this.firstName = parts[0] || '';
    this.surname   = parts.length >= 2 ? parts[parts.length - 1] : '';
    this.middleName = parts.length === 3 ? parts[1] : '';
  }

  if (!this.fullName && (this.firstName || this.surname)) {
    this.fullName = `${this.firstName || ''} ${this.middleName || ''} ${this.surname || ''}`.trim();
  }

  next();
});

const User = mongoose.model("User", userSchema);

export default User;