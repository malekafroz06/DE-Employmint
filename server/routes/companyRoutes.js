import express from "express";
import {
  ChangeJobApplicationStatus,
  changeVisiblity,
  getCompanyData,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  postJob,
  registerCompany,
  sendResetCode,
  verifyResetCode,
  getPublicCompanyJobs,
  googleAuth,
  getPublicCompanyProfile,
  resetSubUserPassword,
  updateSubUserPermissions,
  

} from "../controller/comapanyController.js";
import { getCandidateInsights } from "../controller/candidateInsightsController.js";
import jwt from 'jsonwebtoken';
import { companyAuthMiddleware,requirePostJobPermission,
  requireBulkUploadPermission, } from "../middleware/companyAuthMiddleware.js";
import { uploadImage } from '../config/multer.js';
import SubUser from "../models/SubUser.js";
import bcrypt from "bcrypt";
import Company from "../models/Company.js";

const router = express.Router();

// ========================================
// MIDDLEWARE: Block Sub-Users from Protected Actions
// ========================================
const blockSubUsers = (req, res, next) => {
  if (req.isSubUser) {
    const roleType = req.subUserRole || 'Sub-user';
    return res.status(403).json({
      success: false,
      message: `${roleType.toUpperCase()} users do not have permission to perform this action. Only main recruiters can access this feature.`
    });
  }
  next();
};

// Block Accept/Reject for Sub-Users
const blockSubUserStatusChange = (req, res, next) => {
  if (req.isSubUser) {
    return res.status(403).json({
      success: false,
      message: `${req.subUserRole?.toUpperCase() || 'Sub-user'} users cannot accept or reject applications. You can only view and assess candidates.`
    });
  }
  next();
};

// ==================== PUBLIC ROUTES ====================

// Registration with image upload
router.post('/register', uploadImage.single('image'), registerCompany);

// ✅ UPDATED: Login (handles both main company and sub-users)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);

    // STEP 1: Check if it's a sub-user first
    const subUser = await SubUser.findOne({ email });
    
    if (subUser) {
      console.log('✅ Sub-user found:', subUser.name, '- Role:', subUser.roleType);
      
      // Verify password
      const isMatch = await bcrypt.compare(password, subUser.password);
      
      if (!isMatch) {
        console.log('❌ Password mismatch!');
        return res.json({ success: false, message: "Invalid credentials" });
      }

      console.log('✅ Password matched!');

      // Create token with sub-user info
      const token = jwt.sign({ 
        id: subUser._id, 
        isSubUser: true,
        roleType: subUser.roleType,
        parentCompanyId: subUser.parentCompanyId,
        permissions: subUser.permissions // ✅ ADDED
      }, process.env.JWT_SECRET);

      console.log('✅ Sub-user login successful');

      // ✅ CRITICAL: Return complete sub-user info with permissions
      return res.json({ 
        success: true, 
        token,
        company: {
          _id: subUser._id,
          name: subUser.name,
          email: subUser.email,
          isSubUser: true,
          roleType: subUser.roleType,
          permissions: subUser.permissions // ✅ ADDED
        }
      });
    }

    console.log('Not a sub-user, checking main company...');

    // STEP 2: If not sub-user, check main company table
    const company = await Company.findOne({ email });
    
    if (!company) {
      console.log('❌ Company not found');
      return res.json({ success: false, message: "Invalid credentials" });
    }

    console.log('✅ Main company found:', company.name);

    // Check if company registered with Google (no password)
    if (!company.password || company.password === '') {
      return res.json({ 
        success: false, 
        message: "This account uses Google Sign-In. Please use 'Continue with Google' button.",
        useGoogleAuth: true
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, company.password);
    
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Create token for main company
    const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET);

    console.log('✅ Main company login successful');

    // ✅ Return main company data
    res.json({ 
      success: true, 
      token, 
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
        phone: company.phone,
        isSubUser: false,
        roleType: null
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Google Auth with optional image upload
router.post('/google-auth', uploadImage.single('image'), googleAuth);

// Password reset routes
router.post("/send-reset-code", sendResetCode);
router.post("/verify-reset-code", verifyResetCode);

// Public company profile and jobs
router.get('/profile/:id', getPublicCompanyProfile);
router.get('/jobs/:id', getPublicCompanyJobs);

// ==================== PROTECTED ROUTES ====================

// ✅ OPEN TO ALL (Main Recruiters & Sub-Users)
router.get("/company", companyAuthMiddleware, getCompanyData);
router.get("/applicants", companyAuthMiddleware, getCompanyJobApplicants);
router.get("/candidate-insights", companyAuthMiddleware, getCandidateInsights);

// ✅ MAIN RECRUITER ONLY - Block Sub-Users
router.post("/post-job", companyAuthMiddleware, requirePostJobPermission, postJob);
router.get("/list-jobs", companyAuthMiddleware, blockSubUsers, getCompanyPostedJobs);
router.post("/change-visibility", companyAuthMiddleware, blockSubUsers, changeVisiblity);

// ✅ MAIN RECRUITER ONLY - Accept/Reject Applications
router.post("/change-status", companyAuthMiddleware, blockSubUserStatusChange, ChangeJobApplicationStatus);

// ✅ MAIN RECRUITER ONLY - Team Management Routes
router.post("/create-subuser", companyAuthMiddleware, blockSubUsers, async (req, res) => {
  try {
    const { email, password, name, roleType, permissions } = req.body; // ✅ ADDED permissions
    const companyId = req.companyId;
    
    console.log('=== CREATING SUB-USER ===');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Role:', roleType);
    console.log('Permissions:', permissions); // ✅ ADDED
    console.log('Parent Company ID:', companyId);
    
    // Check if email exists
    const existingSubUser = await SubUser.findOne({ email });
    if (existingSubUser) {
      return res.json({ success: false, message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const subUser = new SubUser({
      parentCompanyId: companyId,
      email,
      password: hashedPassword,
      name,
      roleType,
      permissions: permissions || { // ✅ ADDED with defaults
        canViewApplications: true,
        canPostJobs: false,
        canManageBulkUpload: false
      }
    });

    await subUser.save();
    console.log('✅ Sub-user created successfully with permissions');
    
    res.json({ success: true, message: "Team member added successfully" });
  } catch (error) {
    console.error('❌ Create sub-user error:', error);
    res.json({ success: false, message: error.message });
  }
});

router.get("/subusers", companyAuthMiddleware, blockSubUsers, async (req, res) => {
  try {
    console.log('=== FETCHING SUB-USERS ===');
 
    
    const subUsers = await SubUser.find({ 
      parentCompanyId: req.companyId 
    }).select('-password');
    
    console.log('✅ Found', subUsers.length, 'sub-users');
    
    res.json({ success: true, subUsers });
  } catch (error) {
    console.error('❌ Fetch sub-users error:', error);
    res.json({ success: false, message: error.message });
  }
});

// ✅ CRITICAL FIX: Reset password MUST come BEFORE delete route to avoid route conflicts
router.put('/subuser/:id/reset-password', companyAuthMiddleware, blockSubUsers, resetSubUserPassword);
router.put('/subuser/:id/permissions', companyAuthMiddleware, blockSubUsers, updateSubUserPermissions);
router.delete("/subuser/:id", companyAuthMiddleware, blockSubUsers, async (req, res) => {
  try {
    console.log('=== DELETING SUB-USER ===');
    console.log('Sub-user ID:', req.params.id);
    console.log('Company ID:', req.companyId);
    
    // ✅ Verify ownership before deleting
    const subUser = await SubUser.findOne({
      _id: req.params.id,
      parentCompanyId: req.companyId
    });
    
    if (!subUser) {
      return res.json({ 
        success: false, 
        message: "Team member not found or you don't have permission to delete" 
      });
    }
    
    await SubUser.findByIdAndDelete(req.params.id);
    console.log('✅ Sub-user deleted successfully');
    
    res.json({ success: true, message: "Team member removed" });
  } catch (error) {
    console.error('❌ Delete sub-user error:', error);
    res.json({ success: false, message: error.message });
  }
});

export default router;