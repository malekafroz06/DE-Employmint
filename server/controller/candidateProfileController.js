import User from "../models/User.js";
import { getOrCreateUser } from "./userController.js";

// The candidate's own side of the Edit Candidate popup. Each endpoint mirrors a
// recruiter one in routes/bulkUpload.js (/candidate/:id/...) and returns the same
// shape — `candidateProfile` like Resume.candidateProfile — but edits the signed-in
// candidate's User record. Values are stored in the flat User fields My Profile
// already uses, so My Profile, applications and Hiring Pulse see the same data.

const PERSONAL_FIELDS = ["gender", "dob", "city", "state", "maritalStatus", "languages", "preferredLocation"];

// Popup field → User field, where the names differ
const PROFESSIONAL_FIELDS = {
  sector: "sector",
  category: "jobCategory",
  product: "selectedProducts",
  channel: "jobChannel",
  currentDesignation: "currentDesignation",
  currentDepartment: "currentDepartment",
  currentCompany: "currentCompany",
  currentCTC: "currentCTC",
  expectedCTC: "expectedCTC",
  totalExperience: "totalExperience",
  roleExperience: "roleExperience",
  noticePeriod: "noticePeriod",
  availability: "availability",
  jobChangeStatus: "jobChangeStatus",
  hiringStatus: "hiringStatus",
};

const EDUCATION_FIELDS = ["level", "degreeName", "institute", "modeOfEducation", "percentage", "specialization", "isHighestEducation"];
const SKILL_FIELDS = ["category", "name", "description", "proficiencyLevel", "isCoreSkill"];

const pickFields = (source = {}, allowed) => {
  const out = {};
  allowed.forEach((key) => {
    if (source[key] !== undefined) out[key] = source[key];
  });
  return out;
};

const dateOnly = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// User record → the popup's candidateProfile shape
export const toCandidateProfile = (user) => ({
  personal: {
    gender: user.gender || "",
    dob: dateOnly(user.dob),
    city: user.city || "",
    state: user.state || "",
    maritalStatus: user.maritalStatus || "",
    languages: user.languages || "",
    preferredLocation: user.preferredLocation || "",
  },
  professional: Object.fromEntries(
    Object.entries(PROFESSIONAL_FIELDS).map(([popupKey, userKey]) => [popupKey, user[userKey] || ""])
  ),
  skills: user.skills || [],
  education: user.education || [],
  lastVerified: user.profileLastEdited || null,
});

const loadUser = (req) => getOrCreateUser(req.auth.userId, req.auth.sessionClaims);

// Save and reply with the updated profile; `extra` adds fields to `data`
const saveAndRespond = async (res, user, message, extra) => {
  user.profileLastEdited = new Date();
  await user.save();
  const candidateProfile = toCandidateProfile(user);
  res.json({ success: true, message, data: extra ? { ...extra(user), candidateProfile } : candidateProfile });
};

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error(`${label} error:`, error);
    const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
    res.status(status).json({ success: false, message: status === 400 ? error.message : "Internal server error: " + error.message });
  }
};

// PATCH /api/users/profile/info — name, email, phone
export const updateProfileInfo = handle("Update profile info", async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const phone = String(req.body.phone ?? "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Full name is required" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email" });
  }

  const user = await loadUser(req);
  user.fullName = name;
  user.name = name;
  user.emailId = email;
  user.mobileNo = phone;
  await saveAndRespond(res, user, "Profile information updated", (u) => ({
    parsedData: { name: u.fullName, email: u.emailId, phone: u.mobileNo },
  }));
});

// PATCH /api/users/profile/personal
export const updateProfilePersonal = handle("Update profile personal", async (req, res) => {
  const updates = pickFields(req.body, PERSONAL_FIELDS);
  const user = await loadUser(req);
  Object.entries(updates).forEach(([k, v]) => {
    user[k] = k === "dob" ? (v ? new Date(v) : null) : v;
  });
  await saveAndRespond(res, user, "Personal information updated");
});

// PATCH /api/users/profile/professional
export const updateProfileProfessional = handle("Update profile professional", async (req, res) => {
  const user = await loadUser(req);
  Object.entries(PROFESSIONAL_FIELDS).forEach(([popupKey, userKey]) => {
    if (req.body[popupKey] !== undefined) user[userKey] = req.body[popupKey];
  });
  // A category picked from the list replaces any old "Other" free text
  if (req.body.category !== undefined && req.body.category !== "Other") user.otherJobCategory = "";
  if (req.body.channel !== undefined && req.body.channel !== "Other") user.otherJobChannel = "";
  await saveAndRespond(res, user, "Professional details updated");
});

// Skills & Education rows: add / edit / remove, one handler set per list
const rowHandlers = (listKey, fields, label, validate) => ({
  add: handle(`Add ${label}`, async (req, res) => {
    const entry = pickFields(req.body, fields);
    const error = validate(entry);
    if (error) return res.status(400).json({ success: false, message: error });
    const user = await loadUser(req);
    user[listKey].push(entry);
    await saveAndRespond(res, user, `${label} added`);
  }),
  update: handle(`Update ${label}`, async (req, res) => {
    const user = await loadUser(req);
    const row = user[listKey].id(req.params.rowId);
    if (!row) return res.status(404).json({ success: false, message: `${label} not found` });
    row.set(pickFields(req.body, fields));
    await saveAndRespond(res, user, `${label} updated`);
  }),
  remove: handle(`Remove ${label}`, async (req, res) => {
    const user = await loadUser(req);
    const row = user[listKey].id(req.params.rowId);
    if (!row) return res.status(404).json({ success: false, message: `${label} not found` });
    row.deleteOne();
    await saveAndRespond(res, user, `${label} removed`);
  }),
});

export const skillHandlers = rowHandlers("skills", SKILL_FIELDS, "Skill", (e) =>
  e.name ? null : "Skill Name is required"
);
export const educationHandlers = rowHandlers("education", EDUCATION_FIELDS, "Education entry", (e) =>
  e.degreeName || e.level ? null : "Education Level or Degree Name is required"
);
