import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import fetch from 'node-fetch';
import PDFParser from 'pdf2json';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from "jsonwebtoken";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Extract Clerk userId from req.auth (guaranteed by middleware)
const getClerkUserId = (req) => req.auth.userId;

// ------------------ CONTROLLERS ------------------

export const applyForJob = async (req, res) => {
  try {
    console.log("=== applyForJob Debug ===");
    console.log("req.body:", req.body);
    console.log("req.auth:", req.auth);
    
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No user ID found" 
      });
    }

    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    console.log("User data for application:", userData);
    
    const { jobId, companyId } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
    }
    
    if (!userData.resume) {
      return res.status(400).json({ 
        success: false, 
        message: "Please upload your resume before applying" 
      });
    }
    
    const isAlreadyApplied = await JobApplication.findOne({
      userId: userData._id,
      jobId,
    });
    
    if (isAlreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }
    
    const jobData = await Job.findById(jobId);
    if (!jobData) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    
    const applicationData = {
      companyId: companyId || jobData.companyId,
      userId: userData._id,
      jobId,
      date: Date.now(),
      status: "Pending"
    };
    
    console.log("Creating application with data:", applicationData);
    
    await JobApplication.create(applicationData);
    
    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    console.log("=== getUserJobApplications Debug ===");
    
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No user ID found" 
      });
    }

    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    console.log("Fetching applications for user:", userData._id);
    
    const applications = await JobApplication.find({ userId: userData._id })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location jobcategory jobchannel level noticeperiod salary")
      .sort({ date: -1 })
      .exec();
    
    console.log("Found applications:", applications?.length || 0);
    
    res.json({ success: true, applications: applications || [] });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resume upload
export const updateUserResume = async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    const resumeFile = req.file;
    
    if (!resumeFile) {
      return res.status(400).json({ 
        success: false, 
        message: "No resume file provided" 
      });
    }
    
    const fileName = `resume_${userData._id}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../uploads/resumes', fileName);
    fs.writeFileSync(filePath, fs.readFileSync(resumeFile.path));
    const resumeUrl = `/uploads/resumes/${fileName}`;
    fs.unlinkSync(resumeFile.path);
    
    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      { resume: resumeUrl },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: "Resume Updated Successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Profile update
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const profileData = req.body;
    
    console.log("=== UPDATE PROFILE DEBUG ===");
    console.log("User ID:", userId);
    console.log("Profile Data Received:", profileData);
    
    if (!userId) {
      return res.json({
        success: false,
        message: "User authentication failed - no user ID found"
      });
    }
    
    let user = await User.findById(userId);
    
    if (!user) {
      console.log("Creating new user");
      user = new User({
        _id: userId,
        name: profileData.fullName || profileData.name || 'Unknown',
        email: profileData.emailId || profileData.email || '',
        ...profileData
      });
      await user.save();
      console.log("New user created");
    } else {
      console.log("Updating existing user");
      
      // ── Personal Details ──────────────────────────────────────────
      if (profileData.fullName !== undefined)     user.fullName     = profileData.fullName;
      if (profileData.gender !== undefined)       user.gender       = profileData.gender;
      if (profileData.dob !== undefined)          user.dob          = profileData.dob;
      if (profileData.mobileNo !== undefined)     user.mobileNo     = profileData.mobileNo;
      if (profileData.emailId !== undefined)      user.emailId      = profileData.emailId;
      if (profileData.city !== undefined)         user.city         = profileData.city;
      if (profileData.state !== undefined)        user.state        = profileData.state;
      if (profileData.languages !== undefined)    user.languages    = profileData.languages;
      if (profileData.maritalStatus !== undefined) user.maritalStatus = profileData.maritalStatus;

      // ── Professional Details ──────────────────────────────────────
      if (profileData.currentDesignation !== undefined) user.currentDesignation = profileData.currentDesignation;
      if (profileData.currentDepartment !== undefined)  user.currentDepartment  = profileData.currentDepartment;
      if (profileData.currentCTC !== undefined)         user.currentCTC         = profileData.currentCTC;
      if (profileData.noticePeriod !== undefined)       user.noticePeriod       = profileData.noticePeriod;
      if (profileData.totalExperience !== undefined)    user.totalExperience    = profileData.totalExperience;
      if (profileData.roleType !== undefined)           user.roleType           = profileData.roleType;
      if (profileData.jobChangeStatus !== undefined)    user.jobChangeStatus    = profileData.jobChangeStatus;
      if (profileData.sector !== undefined)             user.sector             = profileData.sector;
      if (profileData.category !== undefined)           user.category           = profileData.category;
      if (profileData.otherSector !== undefined)        user.otherSector        = profileData.otherSector;
      if (profileData.otherCategory !== undefined)      user.otherCategory      = profileData.otherCategory;

      // ── NEW: Product & Channel ────────────────────────────────────
      if (profileData.jobCategory !== undefined)     user.jobCategory     = profileData.jobCategory;
      if (profileData.otherJobCategory !== undefined) user.otherJobCategory = profileData.otherJobCategory;
      if (profileData.selectedProducts !== undefined) user.selectedProducts = profileData.selectedProducts;
      if (profileData.jobChannel !== undefined)      user.jobChannel      = profileData.jobChannel;
      if (profileData.otherJobChannel !== undefined)  user.otherJobChannel  = profileData.otherJobChannel;

      // Keep name in sync with fullName
      if (profileData.fullName) user.name = profileData.fullName;
      
      await user.save();
      console.log("User updated successfully");
    }
    
    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: user
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Resume parsing
const parseResumeInfo = (text) => {
  const originalText = text.replace(/\s+/g, ' ').trim();
  console.log("=== PDF TEXT ANALYSIS ===");
  console.log("Full extracted text length:", originalText.length);
  console.log("COMPLETE EXTRACTED TEXT:", originalText);
  console.log("========================");
  
  const lines = originalText.split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log("Total lines:", lines.length);
  console.log("First 15 lines:");
  lines.slice(0, 15).forEach((line, i) => {
    console.log(`Line ${i + 1}: "${line}"`);
  });
  
  const result = {
    fullName: '',
    gender: '',
    dob: '',
    emailId: '',
    mobileNo: '',
    currentDesignation: '',
    currentDepartment: '',
    totalExperience: '',
    city: '',
    state: '',
    languages: ''
  };
  
  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = originalText.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    result.emailId = emailMatches[0];
    console.log("Email found:", result.emailId);
  }
  
  // Extract phone
  const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{9}/g;
  const phoneMatches = originalText.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    result.mobileNo = phoneMatches[0].replace(/\D/g, '').slice(-10);
    console.log("Phone found:", result.mobileNo);
  }
  
  // Extract full name
  let nameFound = false;
  for (let i = 0; i < Math.min(3, lines.length) && !nameFound; i++) {
    const line = lines[i].trim();
    console.log(`Analyzing line ${i + 1} for name: "${line}"`);
    
    if (line.includes('@') || 
        /\d/.test(line) || 
        line.length > 50 ||
        line.length < 4 ||
        /resume|cv|profile|contact|address|phone|email|mobile|objective|summary|experience|education|skills|projects|work|employment/i.test(line)) {
      console.log(`Skipping line ${i + 1}: contains excluded content`);
      continue;
    }
    
    const words = line.split(/\s+/).filter(word => word.length > 0);
    console.log(`Line ${i + 1} words:`, words);
    
    if (words.length >= 2 && words.length <= 4) {
      const isValidName = words.every(word => {
        const isProperlyCapitalized = /^[A-Z][a-z]+$/.test(word);
        const isReasonableLength = word.length >= 2 && word.length <= 15;
        const isOnlyLetters = /^[A-Za-z]+$/.test(word);
        const isNotCommonWord = !['The', 'And', 'For', 'With', 'From', 'To', 'In', 'On', 'At', 'By'].includes(word);
        return isProperlyCapitalized && isReasonableLength && isOnlyLetters && isNotCommonWord;
      });
      
      if (isValidName) {
        result.fullName = words.join(' ');
        nameFound = true;
        console.log(`Full name successfully extracted: ${result.fullName}`);
        break;
      }
    }
  }
  
  // Extract gender
  const genderRegex = /\b(male|female|m\/f|gender[:\s]*(male|female))\b/i;
  const genderMatch = originalText.match(genderRegex);
  if (genderMatch) {
    const genderText = genderMatch[0].toLowerCase();
    if (genderText.includes('female')) {
      result.gender = 'Female';
    } else if (genderText.includes('male')) {
      result.gender = 'Male';
    }
    console.log("Gender found:", result.gender);
  }
  
  // Extract date of birth
  const dobRegex = /(?:dob|date of birth|born)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
  const dobMatch = originalText.match(dobRegex);
  if (dobMatch) {
    result.dob = dobMatch[1];
    console.log("DOB found:", result.dob);
  }
  
  // Extract experience
  const expRegex = /(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/i;
  const expMatch = originalText.match(expRegex);
  if (expMatch) {
    result.totalExperience = `${expMatch[1]} years`;
    console.log("Experience found:", result.totalExperience);
  }
  
  console.log("=== FINAL EXTRACTION RESULT ===");
  console.log("Result:", result);
  
  const filledFields = Object.entries(result).filter(([key, value]) => 
    value && value.toString().trim() !== ''
  ).length;
  console.log(`Extracted ${filledFields} fields successfully`);
  
  return result;
};

// Extract resume data
export const extractResumeData = async (req, res) => {
  let tempFilePath = null;
  
  try {
    const userId = req.auth?.userId;
    const { resumeUrl } = req.body;

    console.log("PDF Extraction Debug:");
    console.log("User ID:", userId);
    console.log("Resume URL:", resumeUrl);

    if (!userId) {
      return res.json({ success: false, message: "User authentication failed" });
    }

    if (!resumeUrl) {
      return res.json({ success: false, message: "Resume URL is required" });
    }

    console.log("Downloading PDF from:", resumeUrl);

    const response = await fetch(resumeUrl);
    console.log("Download response status:", response.status);
    
    if (!response.ok) {
      console.error("Failed to download PDF:", response.status, response.statusText);
      return res.json({
        success: false,
        message: `Failed to fetch PDF. Status: ${response.status}. Please check if PDF delivery is enabled in Cloudinary.`
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("PDF buffer size:", buffer.length, "bytes");

    if (buffer.length === 0) {
      throw new Error('Downloaded PDF is empty');
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    tempFilePath = path.join(tempDir, `resume_${userId}_${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, buffer);
    console.log("Saved PDF to:", tempFilePath);

    const pdfParser = new PDFParser();
    
    const parsePDFPromise = new Promise((resolve, reject) => {
      let timeoutId;
      
      pdfParser.on('pdfParser_dataError', (errData) => {
        clearTimeout(timeoutId);
        console.error("PDF parsing error:", errData);
        reject(new Error(`PDF parsing failed: ${errData.parserError}`));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        clearTimeout(timeoutId);
        try {
          console.log("PDF parsed successfully");
          console.log("Number of pages:", pdfData.Pages?.length || 0);
          
          let fullText = '';
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            pdfData.Pages.forEach((page, pageIndex) => {
              console.log(`Processing page ${pageIndex + 1}...`);
              if (page.Texts && page.Texts.length > 0) {
                page.Texts.forEach(textItem => {
                  if (textItem.R && textItem.R.length > 0) {
                    textItem.R.forEach(textRun => {
                      if (textRun.T) {
                        const decodedText = decodeURIComponent(textRun.T);
                        fullText += decodedText + ' ';
                      }
                    });
                  }
                });
                fullText += '\n';
              }
            });
          }
          
          const cleanedText = fullText.trim();
          console.log("Extracted text length:", cleanedText.length);
          console.log("First 200 characters:", cleanedText.substring(0, 200));
          
          resolve(cleanedText);
        } catch (error) {
          console.error("Error processing PDF data:", error);
          reject(error);
        }
      });

      timeoutId = setTimeout(() => {
        console.error("PDF parsing timeout");
        reject(new Error('PDF parsing timeout'));
      }, 30000);

      console.log("Starting PDF parsing...");
      pdfParser.loadPDF(tempFilePath);
    });

    const extractedText = await parsePDFPromise;
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error('PDF appears to be empty or unreadable');
    }

    console.log("Text extraction successful, parsing information...");

    const extractedData = parseResumeInfo(extractedText);
    
    const filledFields = Object.entries(extractedData).filter(([key, value]) => 
      value && value.toString().trim() !== ''
    ).length;
    console.log("Extraction complete. Filled fields:", filledFields);

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log("Cleaned up temp file");
    }

    res.json({
      success: true,
      extractedData,
      message: `Successfully extracted ${filledFields} fields from resume! Please review and modify as needed.`
    });

  } catch (error) {
    console.error("PDF extraction error:", error);
    
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log("Cleaned up temp file after error");
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
    
    const extractedData = {
      fullName: '',
      gender: '',
      dob: '',
      emailId: '',
      mobileNo: '',
      currentDesignation: '',
      currentDepartment: '',
      totalExperience: '',
      city: '',
      state: '',
      languages: ''
    };

    res.json({
      success: true, 
      extractedData,
      message: `PDF parsing failed: ${error.message}. Please fill in details manually.`
    });
  }
};

// Clerk sync
export const clerkSync = async (req, res) => {
  try {
    const { clerkUserId, email, name, firstName, lastName, profileImageUrl } = req.body;
    console.log("Clerk sync request:", { clerkUserId, email, name, firstName, lastName });

    if (!clerkUserId || !email) {
      return res.json({ success: false, message: "Missing required fields: clerkUserId and email" });
    }

    let user = await User.findById(clerkUserId);
    
    if (!user) {
      user = await User.findOne({ email: email });
      
      if (user) {
        console.log("Found existing user by email, migrating to Clerk ID:", user.email);
        
        const existingData = {
          resume: user.resume,
          mobileNo: user.mobileNo,
          currentDesignation: user.currentDesignation,
          totalExperience: user.totalExperience,
          city: user.city,
          state: user.state,
          fullName: user.fullName || `${user.firstName || ''} ${user.surname || ''}`.trim(),
          gender: user.gender,
          dob: user.dob,
          // Carry over new fields if they exist
          jobCategory: user.jobCategory,
          otherJobCategory: user.otherJobCategory,
          selectedProducts: user.selectedProducts,
          jobChannel: user.jobChannel,
          otherJobChannel: user.otherJobChannel,
        };
        
        await User.findByIdAndDelete(user._id);
        
        user = new User({
          _id: clerkUserId,
          name: name || user.name || 'User',
          email: email,
          emailId: email,
          fullName: name || existingData.fullName || '',
          image: profileImageUrl || user.image || '/default-avatar.png',
          ...existingData
        });
        
        await user.save();
        console.log("Successfully migrated user to Clerk ID");
      } else {
        console.log("Creating new user");
        user = new User({
          _id: clerkUserId,
          name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'User',
          email: email,
          emailId: email,
          fullName: name || `${firstName || ''} ${lastName || ''}`.trim() || '',
          image: profileImageUrl || '/default-avatar.png',
          resume: ''
        });
        await user.save();
        console.log("New user created successfully:", user._id);
      }
    } else {
      console.log("User found by Clerk ID, updating data:", user._id);
      user.name = name || user.name || 'User';
      user.fullName = name || user.fullName || '';
      user.email = email;
      user.emailId = email;
      user.image = profileImageUrl || user.image || '/default-avatar.png';
      await user.save();
      console.log("User updated successfully");
    }

    const token = `user_${user._id}_${Date.now()}`;

    res.json({
      success: true,
      message: "User synced successfully",
      user: {
        _id: user._id,
        name: user.name,
        fullName: user.fullName,
        gender: user.gender,
        dob: user.dob,
        email: user.email,
        emailId: user.emailId,
        image: user.image,
        mobileNo: user.mobileNo,
        currentDesignation: user.currentDesignation,
        totalExperience: user.totalExperience,
        city: user.city,
        state: user.state,
        jobCategory: user.jobCategory,
        selectedProducts: user.selectedProducts,
        jobChannel: user.jobChannel,
      },
      token
    });

  } catch (error) {
    console.error('Clerk sync error:', error);
    if (error.code === 11000) {
      return res.json({ 
        success: false, 
        message: "User already exists. Please try refreshing the page."
      });
    }
    res.json({ success: false, message: `Clerk sync failed: ${error.message}` });
  }
};

// Fix user data
export const fixUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const claims = req.auth.sessionClaims || {};
    
    console.log("=== FIXING USER DATA ===");
    console.log("User ID:", userId);
    
    let user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    const needsUpdate = user.name === "User" || user.email === "user@example.com";
    
    if (needsUpdate) {
      const email = claims.email || user.emailId || user.email;
      const firstName = claims.first_name || claims.firstName || "";
      const lastName = claims.last_name || claims.lastName || "";
      const fullName = claims.name || `${firstName} ${lastName}`.trim();
      
      const updateData = {};
      if (fullName && fullName !== "User") {
        updateData.name = fullName;
        updateData.fullName = fullName;
      }
      if (email && email !== "user@example.com") {
        updateData.email = email;
        updateData.emailId = email;
      }
      
      console.log("Updating user with:", updateData);
      
      user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
      res.json({ success: true, message: "User data updated successfully", user });
    } else {
      res.json({ success: true, message: "User data is already correct", user });
    }
    
  } catch (error) {
    console.error("Fix user data error:", error);
    res.json({ success: false, message: error.message });
  }
};

// getOrCreateUser helper
const getOrCreateUser = async (clerkUserId, claims) => {
  let user = await User.findById(clerkUserId);
  
  if (!user) {
    console.log("Creating new user for Clerk ID:", clerkUserId);

    const email = claims?.email || 
                 claims?.email_addresses?.[0]?.email_address || 
                 "temp@example.com";
    
    const username = claims?.username || "";
    const fullName = claims?.name || claims?.full_name || "";
    const firstName = claims?.first_name || "";
    const lastName = claims?.last_name || "";
    
    let name = "";
    if (username) {
      name = username;
    } else if (fullName) {
      name = fullName;
    } else if (firstName || lastName) {
      name = `${firstName} ${lastName}`.trim();
    } else if (email && email !== "temp@example.com") {
      name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      name = "User";
    }
    
    const image = claims?.image_url || claims?.imageUrl || "/default-avatar.png";

    try {
      user = new User({
        _id: clerkUserId,
        name: name,
        email: email,
        emailId: email,
        fullName: name,
        image: image,
        resume: "",
      });
      await user.save();
      console.log("Created user with name:", name, "and email:", email);
    } catch (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }
  }
  
  return user;
};

// getUserData
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    console.log("=== getUserData Debug ===");
    console.log("User ID:", userId);
    
    let user = await User.findById(userId);
    
    if (!user) {
      const claims = req.auth.sessionClaims || {};
      const email = claims.email || "temp@example.com";
      const username = claims.username || "";
      const fullName = claims.name || claims.full_name || "";
      const firstName = claims.first_name || "";
      const lastName = claims.last_name || "";
      let name = username || fullName || `${firstName} ${lastName}`.trim() || "User";
      const image = claims.image_url || claims.imageUrl || "/default-avatar.png";
      
      user = new User({
        _id: userId,
        name: name,
        email: email,
        emailId: email,
        fullName: name,
        image: image,
        resume: ""
      });
      
      await user.save();
      console.log("New user created with name:", name, "email:", email);
    } 
    
    res.json({ success: true, user: user });
  } catch (error) {
    console.error("getUserData error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Debug endpoint
export const debugClerkData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const claims = req.auth.sessionClaims || {};
    console.log("=== CLERK DEBUG DATA ===");
    console.log("User ID:", userId);
    res.json({
      success: true,
      debug: {
        userId: userId,
        fullAuth: req.auth,
        sessionClaims: claims,
        extractedData: {
          email: claims.email || "not found",
          username: claims.username || "not found",
          fullName: claims.name || claims.full_name || "not found"
        }
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Force refresh user data
export const forceRefreshUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const claims = req.auth.sessionClaims || {};
    console.log("=== FORCE REFRESH USER DATA ===");
    
    let user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    const email = claims.email || user.email;
    const username = claims.username || "";
    const fullName = claims.name || claims.full_name || "";
    let name = username || fullName || user.name;
    
    const updateData = {
      name: name || user.name,
      email: email || user.email,
      emailId: email || user.emailId,
      fullName: name || user.fullName
    };
    
    console.log("Force updating user with:", updateData);
    
    user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
    
    res.json({ success: true, message: "User data refreshed successfully", user });
    
  } catch (error) {
    console.error("Force refresh error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete resume
export const deleteUserResume = async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);

    // Delete the physical file if it exists on disk
    if (userData.resume) {
      const filePath = path.join(__dirname, '..', userData.resume);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted resume file:", filePath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      { resume: '' },
      { new: true }
    );

    res.json({
      success: true,
      message: "Resume deleted successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};