import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
// ✅ FIXED: Import the correct function name
import { recordJobMatch } from '../services/jobNotificationService.js';
import EmployerProfile from '../models/EmployerProfile.js';
import crypto from 'crypto';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import SubUser from "../models/SubUser.js"; // ✅ ADD THIS at the top
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Google OAuth Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==================== HELPER FUNCTION FOR IMAGE UPLOAD ====================
const saveImageWithFullUrl = (imageFile, dirname) => {
  const fileName = `company_${Date.now()}_${imageFile.originalname}`;
  const uploadDir = path.join(dirname, '../uploads/images');
  const filePath = path.join(uploadDir, fileName);
  
  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, fs.readFileSync(imageFile.path));
  
  // ✅ SAVE FULL URL instead of relative path
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  const imageUrl = `${backendUrl}/uploads/images/${fileName}`;
  
  fs.unlinkSync(imageFile.path); // Clean temp file
  
  return imageUrl;
};

// ==================== PART 1: AUTH & COMPANY MANAGEMENT ====================
export const registerCompany = async (req, res, next) => {
  const { name, email, password, phone } = req.body;
  const imageFile = req.file;

  console.log("📝 Registration attempt:", { name, email, phone });

  if (!name || !email || !password || !phone) {
    return res.json({ 
      success: false, 
      message: "Name, email, password, and phone are required" 
    });
  }

  try {
    // ✅ Validate phone number format
    const trimmedPhone = phone.trim();
    if (!/^\d{10}$/.test(trimmedPhone)) {
      return res.json({ 
        success: false, 
        message: "Phone number must be exactly 10 digits"
      });
    }

    // ✅ Check if email already exists
    const existingEmail = await Company.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.json({ 
        success: false, 
        message: "An account with this email already exists. Please login instead."
      });
    }

    // ✅ Check if phone number already exists
    const existingPhone = await Company.findOne({ phone: trimmedPhone });
    if (existingPhone) {
      return res.json({ 
        success: false, 
        message: "This phone number is already registered with another account. Please use a different phone number or login to your existing account."
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = '';

    // ✅ Use helper function for image upload
    if (imageFile) {
      imageUrl = saveImageWithFullUrl(imageFile, __dirname);
      console.log("✅ Image uploaded:", imageUrl);
    }

    // Create company
    const company = await Company.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: trimmedPhone,
      image: imageUrl,
    });

    console.log("✅ Company created:", company.name);

    res.json({
      success: true,
      message: "Company registered successfully",
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        image: company.image,
      },
      token: generateToken(company._id),
    });
    
  } catch (error) {
    console.error("❌ Registration error:", error);
    
    // ✅ Pass MongoDB duplicate key errors to global handler
    if (error.code === 11000) {
      return next(error);
    }
    
    res.json({ 
      success: false, 
      message: error.message || "Registration failed. Please try again."
    });
  }
};

// Login Company
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  console.log("=== LOGIN ATTEMPT ===");
  console.log("Email:", email);

  try {
    const company = await Company.findOne({ email });

    if (!company) {
      return res.json({ 
        success: false, 
        message: "Company account not found" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    console.log("✅ Login successful for:", company.name);

    const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
        phone: company.phone,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get company data// Update your comapanyController.js - getCompanyData function

// ✅ UPDATED: Return sub-user info when fetching company data
// ✅ FIXED: getCompanyData function with permissions
export const getCompanyData = async (req, res) => {
  try {
    console.log('=== GET COMPANY DATA ===');
    console.log('isSubUser:', req.isSubUser);
    console.log('subUserRole:', req.subUserRole);
    console.log('subUserPermissions:', req.subUserPermissions); // ✅ Added
    console.log('company:', req.company?.name);
    
    // ✅ Build response based on user type
    const responseData = {
      _id: req.company._id,
      name: req.company.name || req.subUserName,
      email: req.company.email,
      image: req.company.image,
      phone: req.company.phone,
      // ✅ CRITICAL: Include sub-user flags AND permissions
      isSubUser: req.isSubUser || false,
      roleType: req.subUserRole || null,
      permissions: req.subUserPermissions || null // ✅ ADDED THIS LINE
    };
    
    console.log('=== RESPONSE DATA ===');
    console.log('isSubUser:', responseData.isSubUser);
    console.log('roleType:', responseData.roleType);
    console.log('permissions:', responseData.permissions); // ✅ Added
    
    res.json({ 
      success: true, 
      company: responseData 
    });
    
  } catch (error) {
    console.error('Get company data error:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
// Send password reset code via email using Resend
export const sendResetCode = async (req, res) => {
  const { email } = req.body;

  console.log("=== SEND RESET CODE ===");
  console.log("Email:", email);

  if (!email || !email.trim()) {
    return res.json({ 
      success: false, 
      message: "Email is required" 
    });
  }

  try {
    const trimmedEmail = email.trim();
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    if (!company) {
      return res.json({ 
        success: false, 
        message: "This email is not registered as a recruiter account" 
      });
    }

    // Generate 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset code to company document
    company.resetCode = resetCode;
    company.resetCodeExpiry = resetCodeExpiry;
    await company.save();

    console.log("✅ Reset code generated:", resetCode);

    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: `${process.env.APP_NAME || 'Job Portal'} <onboarding@resend.dev>`,
        to: [company.email],
        subject: 'Password Reset Code - Action Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 40px auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .header { 
                background: #020330; 
                color: white; 
                padding: 40px 30px; 
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content { 
                padding: 40px 30px;
                background: white;
              }
              .code-box { 
                background: #f8f9fa;
                border: 3px solid #FF0000; 
                padding: 24px; 
                text-align: center; 
                font-size: 36px; 
                font-weight: bold; 
                color: #FF0000; 
                margin: 30px 0; 
                border-radius: 10px; 
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .info-box {
                background: #f8f9fa;
                border-left: 4px solid #4CAF50;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .warning { 
                background: #fff3cd; 
                border-left: 4px solid #ffc107; 
                padding: 16px; 
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer { 
                text-align: center; 
                padding: 30px; 
                color: #666; 
                font-size: 13px;
                background: #f8f9fa;
                border-top: 1px solid #e0e0e0;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #FF0000;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              p { margin: 12px 0; }
              strong { color: #020330; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${company.name}</strong>,</p>
                <p>We received a request to reset the password for your recruiter account. Use the verification code below to proceed:</p>
                
                <div class="code-box">${resetCode}</div>
                
                <div class="info-box">
                  <strong>⏰ This code will expire in 15 minutes</strong><br>
                  <small>Please complete the password reset process before the code expires.</small>
                </div>

                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <div class="warning">
                  <strong>🔒 Security Tips:</strong>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>Never share this code with anyone</li>
                    <li>Our team will never ask for this code</li>
                    <li>Make sure you're on the official website</li>
                  </ul>
                </div>

                <p style="margin-top: 30px;">If you need assistance, please contact our support team.</p>
              </div>
              <div class="footer">
                <p style="margin: 0 0 8px 0;"><strong>${process.env.APP_NAME || 'Job Portal'}</strong></p>
                <p style="margin: 0;">This is an automated email, please do not reply directly to this message.</p>
                <p style="margin: 8px 0 0 0; color: #999;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        console.error("❌ Resend error:", error);
        return res.json({ 
          success: false, 
          message: "Failed to send reset code email. Please try again." 
        });
      }

      console.log("✅ Reset code email sent successfully via Resend:", data);

      return res.json({ 
        success: true, 
        message: "Reset code sent to your email address" 
      });

    } catch (emailError) {
      console.error("❌ Email sending error:", emailError);
      return res.json({ 
        success: false, 
        message: "Failed to send reset code email. Please try again or contact support." 
      });
    }

  } catch (error) {
    console.error("Send reset code error:", error);
    return res.json({ 
      success: false, 
      message: "Error processing reset request: " + error.message 
    });
  }
};

// Verify reset code and update password
export const verifyResetCode = async (req, res) => {
  const { email, code, newPassword } = req.body;

  console.log("=== VERIFY RESET CODE ===");
  console.log("Email:", email);
  console.log("Code:", code);

  if (!email || !code || !newPassword) {
    return res.json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  try {
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    if (!company) {
      return res.json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    // Check if reset code exists
    if (!company.resetCode || !company.resetCodeExpiry) {
      return res.json({ 
        success: false, 
        message: "No reset code found. Please request a new one." 
      });
    }

    // Check if reset code has expired
    if (new Date() > company.resetCodeExpiry) {
      company.resetCode = undefined;
      company.resetCodeExpiry = undefined;
      await company.save();
      
      return res.json({ 
        success: false, 
        message: "Reset code has expired. Please request a new one." 
      });
    }

    // Verify reset code
    if (company.resetCode !== trimmedCode) {
      return res.json({ 
        success: false, 
        message: "Invalid reset code. Please check and try again." 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);
    
    // Update password and clear reset code
    company.password = hashedPassword;
    company.resetCode = undefined;
    company.resetCodeExpiry = undefined;
    await company.save();

    console.log("✅ Password reset successful for:", company.email);

    // Generate new token
    const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET);

    // Send confirmation email
    try {
      await resend.emails.send({
        from: `${process.env.APP_NAME || 'Job Portal'} <onboarding@resend.dev>`,
        to: [company.email],
        subject: 'Password Changed Successfully',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #020330; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 16px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Changed</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${company.name}</strong>,</p>
                <div class="success-box">
                  <strong>Your password has been changed successfully!</strong>
                </div>
                <p>You can now log in to your recruiter account with your new password.</p>
                <p>If you did not make this change, please contact our support team immediately.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (confirmEmailError) {
      console.log("Confirmation email failed but password was reset:", confirmEmailError);
    }

    return res.json({ 
      success: true, 
      message: "Password reset successfully",
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        image: company.image
      }
    });

  } catch (error) {
    console.error("Verify reset code error:", error);
    return res.json({ 
      success: false, 
      message: "Failed to reset password: " + error.message 
    });
  }
};

// ==================== PART 2: JOB MANAGEMENT & PUBLIC ENDPOINTS ====================

// Post a new Job
export const postJob = async (req, res) => {
  const { title, description, location, salary, jobcategory, jobchannel, level, noticeperiod, designation } = req.body;

  const companyId = req.company._id;

  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      date: Date.now(),
      level,
      jobcategory,
      jobchannel,
      noticeperiod,
      designation,
    });

    const savedJob = await newJob.save();
    
    // ✅ FIXED: Use recordJobMatch instead of notifyJobAlerts
    // This adds the job to matching job alerts' pendingJobs arrays
    // Users will receive batch digest emails (daily/weekly) via cron job
    const matchedAlerts = await recordJobMatch(savedJob);
    
    console.log(`📬 Job added to ${matchedAlerts} job alert queues for batch processing`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully!',
      data: savedJob,
      alertsQueued: matchedAlerts // How many alerts will include this in their next digest
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// Get Company Job Applicants


export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    const applications = await JobApplication.find({ companyId })
      .populate("userId") // Fetch ALL user fields by removing select
      .populate("jobId", "title location designation jobcategory jobchannel level noticeperiod salary")
      .exec();

    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// Get Company Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;

    const jobs = await Job.find({ companyId });

    // Auto-expire jobs older than 15 days
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const expiredIds = jobs
      .filter(job => job.visible && job.date < fifteenDaysAgo)
      .map(job => job._id);

    if (expiredIds.length > 0) {
      await Job.updateMany({ _id: { $in: expiredIds } }, { visible: false });
      expiredIds.forEach(id => {
        const job = jobs.find(j => j._id.equals(id));
        if (job) job.visible = false;
      });
    }

    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await JobApplication.find({ jobId: job._id });
        return { ...job.toObject(), applicants: applicants.length };
      })
    );

    res.json({ success: true, jobsData });
  } catch (error) {
    console.error("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Change Job Application Status
export const ChangeJobApplicationStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    await JobApplication.findOneAndUpdate(
      { _id: id },
      { status }
    );
    
    res.json({ success: true, message: "Status Changed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Change Job Visibility
export const changeVisiblity = async (req, res) => {
  try {
    const { id } = req.body;
    const companyID = req.company._id;

    const job = await Job.findById(id);
    
    if (!job) {
      return res.json({ success: false, message: "Job not found" });
    }

    if (companyID.toString() !== job.companyId.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { visible: !job.visible },
      { 
        new: true, 
        runValidators: false
      }
    );

    res.json({ 
      success: true, 
      message: job.visible ? "Job hidden successfully" : "Job made visible successfully",
      job: updatedJob 
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Public Company Profile
// ✅ FIXED: Get Public Company Profile
export const getPublicCompanyProfile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.json({
                success: false,
                message: 'Invalid company ID format'
            });
        }

        const [company, profile] = await Promise.all([
            Company.findById(id).select('-password'),
            EmployerProfile.findOne({ companyId: id })
        ]);

        if (!company) {
            return res.json({
                success: false,
                message: 'Company not found'
            });
        }

        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId: id, visible: true }),
            JobApplication.countDocuments({ companyId: id }),
            JobApplication.countDocuments({ companyId: id, status: 'Accepted' })
        ]);

        const stats = { activeJobs, totalApplications, totalHired };

        const responseData = {
            _id: company._id,
            name: company.name,
            email: company.email,
            phone: company.phone,
            image: company.image,
            location: profile?.location || '',
            website: profile?.website || '',
            companySize: profile?.companySize || '',
            description: profile?.description || '',
            stats: stats,
            createdAt: company.createdAt
        };

        res.json({
            success: true,
            message: 'Company profile fetched successfully',
            data: responseData
        });

    } catch (error) {
        res.json({
            success: false,
            message: 'Error fetching company profile: ' + error.message
        });
    }
};

// ✅ FIXED: Get Public Company Jobs
export const getPublicCompanyJobs = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.json({
                success: false,
                message: 'Invalid company ID format'
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.json({
                success: false,
                message: 'Company not found'
            });
        }

        const jobs = await Job.find({ 
            companyId: id, 
            visible: true 
        })
        .populate('companyId', 'name image')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const totalJobs = await Job.countDocuments({ 
            companyId: id, 
            visible: true 
        });

        res.json({
            success: true,
            message: 'Company jobs fetched successfully',
            data: {
                jobs,
                totalJobs,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalJobs / limit),
                hasNextPage: page < Math.ceil(totalJobs / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        res.json({
            success: false,
            message: 'Error fetching company jobs: ' + error.message
        });
    }
};

// ==================== GOOGLE AUTH ====================
export const googleAuth = async (req, res, next) => {
  try {
    console.log("\n=== GOOGLE AUTH REQUEST START ===");
    console.log("📋 Content-Type:", req.headers['content-type']);
   
    console.log("📁 File:", req.file ? req.file.originalname : 'No file');
    console.log("================================\n");
    
    // ✅ Extract data (works for both JSON and FormData)
    const credential = req.body.credential;
    const phone = req.body.phone;
    const customName = req.body.name;
    const isSignup = req.body.isSignup;
    const imageFile = req.file;
    
    // ✅ Critical validation
    if (!credential || credential === 'undefined' || credential.trim() === '') {
      console.error("❌ CREDENTIAL MISSING OR INVALID");
      console.error("   Received credential:", credential);
      console.error("   Full body:", req.body);
      return res.json({ 
        success: false, 
        message: "Google credential is missing. Please try signing in again." 
      });
    }
    
    console.log("✅ Credential received (length):", credential.length);
    console.log("📞 Phone:", phone || 'Not provided');
    console.log("👤 Custom Name:", customName || 'Not provided');
    console.log("🖼️ Image File:", imageFile ? 'Yes' : 'No');
    
    // ✅ Verify the Google token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      console.log("✅ Token verified successfully");
    } catch (verifyError) {
      console.error("❌ Token verification failed:", verifyError.message);
      return res.json({ 
        success: false, 
        message: "Invalid Google token. Please try signing in again." 
      });
    }
    
    const { email, name: googleName, picture, sub: googleId } = payload;
    
    console.log("📧 Google Email:", email);
    console.log("👤 Google Name:", googleName);
   
    
    // ✅ Check if user exists (by email OR googleId)
    let company = await Company.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });
    
    let isNewUser = false;
    
    if (!company) {
      // ==========================================
      // 🆕 NEW USER - SIGNUP FLOW
      // ==========================================
      
      console.log("\n🆕 NEW USER DETECTED");
      console.log("📋 Checking requirements...");
      
      // ✅ Phone number is REQUIRED for new registration
      if (!phone || phone.trim() === '') {
        console.log("❌ Phone number missing - requesting from user");
        return res.json({ 
          success: false, 
          message: "Phone number is required for registration",
          requiresPhone: true  // ✅ Frontend checks this flag
        });
      }
      
      // ✅ Validate phone number format (exactly 10 digits)
      const trimmedPhone = phone.trim();
      if (!/^\d{10}$/.test(trimmedPhone)) {
        console.log("❌ Invalid phone format:", trimmedPhone);
        return res.json({ 
          success: false, 
          message: "Phone number must be exactly 10 digits"
        });
      }
      
      console.log("✅ Valid phone number:", trimmedPhone);
      
      // ✅ CRITICAL: Check if phone number already exists
      const existingPhone = await Company.findOne({ phone: trimmedPhone });
      if (existingPhone) {
        console.log("❌ Phone number already registered");
        console.log("   Existing account:", existingPhone.email);
        return res.json({ 
          success: false, 
          message: "This phone number is already registered with another account. Please use a different phone number or login to your existing account."
        });
      }
      
      console.log("✅ Phone number available");
      
      // ✅ Check if email is used by manual registration (has password)
      const existingEmailWithPassword = await Company.findOne({ 
        email: email, 
        password: { $exists: true, $ne: '' } 
      });
      
      if (existingEmailWithPassword) {
        console.log("❌ Email already has password-based account");
        return res.json({ 
          success: false, 
          message: "This email is already registered with a password. Please use email/password login instead."
        });
      }
      
      console.log("✅ Email available for Google signup");
      
      // ✅ Handle company logo upload with FULL URL
      let imageUrl = picture || ''; // Default to Google profile picture
      
      if (imageFile) {
        try {
          console.log("📸 Processing image upload...");
          imageUrl = saveImageWithFullUrl(imageFile, __dirname);
          console.log("✅ Image uploaded:", imageUrl);
        } catch (imageError) {
          console.error("⚠️ Image upload error:", imageError.message);
          // Continue with Google profile picture if upload fails
          console.log("   Using Google profile picture instead");
        }
      } else {
        console.log("📸 No custom image - using Google profile picture");
      }
      
      // ✅ Create new company account
      console.log("\n💾 Creating new company account...");
      company = new Company({
        name: customName || googleName,
        email,
        image: imageUrl,
        googleId,
        phone: trimmedPhone,
        password: '' // Empty password for Google OAuth users
      });
      
      await company.save();
      isNewUser = true;
      
      console.log("✅ NEW USER REGISTERED SUCCESSFULLY");
      console.log("   Company ID:", company._id);
      console.log("   Name:", company.name);
      console.log("   Email:", company.email);
      console.log("   Phone:", company.phone);
      console.log("   Image:", imageUrl ? "Custom/Google" : "None");
      
    } else {
      // ==========================================
      // 👤 EXISTING USER - LOGIN FLOW
      // ==========================================
      
      console.log("\n👤 EXISTING USER FOUND");
      console.log("   Company ID:", company._id);
      console.log("   Name:", company.name);
      console.log("   Email:", company.email);
      
      // ✅ Update profile picture if missing or changed
      if (picture && (!company.image || company.image === '')) {
        company.image = picture;
        await company.save();
        console.log("   📸 Updated profile picture from Google");
      }
      
      // ✅ Update googleId if missing (for accounts created before Google login)
      if (!company.googleId) {
        company.googleId = googleId;
        await company.save();
        console.log("   🆔 Added Google ID to existing account");
      }
      
      console.log("✅ EXISTING USER LOGGED IN SUCCESSFULLY");
    }
    
    // ✅ Generate JWT token (7 days expiry)
    const token = jwt.sign(
      { id: company._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log("\n✅ TOKEN GENERATED");
    console.log("=== GOOGLE AUTH SUCCESS ===\n");
    
    res.json({
      success: true,
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
        phone: company.phone
      },
      isNewUser
    });
    
  } catch (error) {
    console.error('\n❌ GOOGLE AUTH ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    // ✅ Pass MongoDB duplicate key errors to global handler
    if (error.code === 11000) {
      return next(error);
    }
    
    // ✅ Handle Google token verification errors
    if (error.message?.includes('Token') || error.message?.includes('verify')) {
      console.error("   Error type: Token Verification");
      return res.json({ 
        success: false, 
        message: "Invalid Google authentication. Please try again."
      });
    }
    
    console.error("=== GOOGLE AUTH FAILED ===\n");
    res.json({ 
      success: false, 
      message: error.message || "Google authentication failed" 
    });
  }
};
// Add this single function to companyController.js
// ✅ CORRECTED: Reset Sub-User Password Function
export const resetSubUserPassword = async (req, res) => {
  try {
    const { id } = req.params; // Sub-user ID from URL
    const { newPassword } = req.body;
    const mainCompanyId = req.companyId; // ✅ Use req.companyId (set by middleware)

    console.log('=== RESET SUB-USER PASSWORD ===');
    console.log('Sub-user ID:', id);
    console.log('Main Company ID:', mainCompanyId);
    console.log('New Password Length:', newPassword?.length);
    console.log('Is Sub-User:', req.isSubUser); // Should be false for main recruiter
    console.log('Sub-User Role:', req.subUserRole); // Should be null for main recruiter

    // ✅ CRITICAL: Main recruiter should NOT be a sub-user
    if (req.isSubUser) {
      return res.json({
        success: false,
        message: 'Sub-users cannot reset passwords. Only main recruiters have this permission.'
      });
    }

    // Validate password
    if (!newPassword || newPassword.trim() === '') {
      return res.json({
        success: false,
        message: 'Password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // ✅ Find the sub-user and verify they belong to this main company
    const subUser = await SubUser.findOne({
      _id: id,
      parentCompanyId: mainCompanyId
    });

    if (!subUser) {
      console.log('❌ Sub-user not found or unauthorized');
      console.log('   Searched for: { _id:', id, ', parentCompanyId:', mainCompanyId, '}');
      
      // ✅ Better debugging: Check if sub-user exists at all
      const existingSubUser = await SubUser.findById(id);
      if (existingSubUser) {
        console.log('   Sub-user EXISTS but belongs to company:', existingSubUser.parentCompanyId);
        console.log('   Your company ID:', mainCompanyId);
      } else {
        console.log('   Sub-user does not exist in database');
      }
      
      return res.json({
        success: false,
        message: 'Sub-user not found or you do not have permission to reset this password'
      });
    }

    console.log('✅ Sub-user found:', subUser.name, subUser.email);
    console.log('   Parent Company ID:', subUser.parentCompanyId);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log('✅ Password hashed successfully');

    // Update password
    subUser.password = hashedPassword;
    await subUser.save();

    console.log('✅ Password reset successful for:', subUser.email);

    res.json({
      success: true,
      message: `Password reset successfully for ${subUser.name}`
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.json({
      success: false,
      message: 'Failed to reset password: ' + error.message
    });
  }
};
// ✅ ADD THESE NEW FUNCTIONS TO companyController.js
// ✅ ADD this function to companyController.js (near other sub-user functions)

export const updateSubUserPermissions = async (req, res) => {
  try {
    const { id } = req.params; // Sub-user ID
    const { permissions } = req.body;
    const mainCompanyId = req.companyId;

    console.log('=== UPDATE SUB-USER PERMISSIONS ===');
    console.log('Sub-user ID:', id);
    console.log('Main Company ID:', mainCompanyId);
    console.log('New Permissions:', permissions);

    // Validate permissions object
    if (!permissions || typeof permissions !== 'object') {
      return res.json({
        success: false,
        message: 'Invalid permissions data'
      });
    }

    // Find the sub-user
    const subUser = await SubUser.findOne({
      _id: id,
      parentCompanyId: mainCompanyId
    });

    if (!subUser) {
      return res.json({
        success: false,
        message: 'Sub-user not found or unauthorized'
      });
    }

    // Update permissions
    subUser.permissions = {
      canViewApplications: true, // Always true
      canPostJobs: permissions.canPostJobs || false,
      canManageBulkUpload: permissions.canManageBulkUpload || false
    };

    await subUser.save();

    console.log('✅ Permissions updated for:', subUser.name);

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      subUser: {
        _id: subUser._id,
        name: subUser.name,
        email: subUser.email,
        roleType: subUser.roleType,
        permissions: subUser.permissions
      }
    });

  } catch (error) {
    console.error('❌ Update permissions error:', error);
    res.json({
      success: false,
      message: 'Failed to update permissions: ' + error.message
    });
  }
};
