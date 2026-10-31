import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { 
  getUserData, 
  applyForJob, 
  getUserJobApplications,
  updateUserResume,
  updateUserProfile,
  fixUserData,
  forceRefreshUserData,
  extractResumeData
} from "../controller/userController.js";
import {
  updateProfileInfo,
  updateProfilePersonal,
  updateProfileProfessional,
  skillHandlers,
  educationHandlers,
} from "../controller/candidateProfileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadResume } from "../config/multer.js";
import User from "../models/User.js"; // Import User model

const userRouter = express.Router();

// For ES6 modules, we need to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apply authentication middleware to all user routes
userRouter.use(authMiddleware);

// Sync user from Clerk to MongoDB (call this after login)
userRouter.post("/sync-user", async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    
    if (!clerkUserId) {
      return res.json({ success: false, message: 'Authentication required' });
    }

    // Check if user already exists
    let user = await User.findOne({ clerkId: clerkUserId });
    
    if (!user) {
      // Create new user
      const sessionClaims = req.auth?.sessionClaims || {};
      
      user = new User({
        clerkId: clerkUserId,
        emailId: sessionClaims.email || sessionClaims.email_addresses?.[0]?.email_address,
        firstName: sessionClaims.first_name || '',
        surname: sessionClaims.last_name || '',
        // Add other default fields
      });
      
      await user.save();
      console.log('New user created in MongoDB:', clerkUserId);
    }

    return res.json({ 
      success: true, 
      message: 'User synced successfully',
      user 
    });
  } catch (error) {
    console.error('Sync user error:', error);
    return res.json({ success: false, message: 'Failed to sync user' });
  }
});

// Candidate's own Edit Profile popup (same tabs as the recruiter's Edit Candidate)
userRouter.patch("/profile/info", updateProfileInfo);
userRouter.patch("/profile/personal", updateProfilePersonal);
userRouter.patch("/profile/professional", updateProfileProfessional);
userRouter.post("/profile/skills", skillHandlers.add);
userRouter.put("/profile/skills/:rowId", skillHandlers.update);
userRouter.delete("/profile/skills/:rowId", skillHandlers.remove);
userRouter.post("/profile/education", educationHandlers.add);
userRouter.put("/profile/education/:rowId", educationHandlers.update);
userRouter.delete("/profile/education/:rowId", educationHandlers.remove);

// Get user data
userRouter.get("/user", getUserData);

// Apply for a job
userRouter.post("/apply", applyForJob);

// Get user applications
userRouter.get("/applications", getUserJobApplications);

// Update user profile
userRouter.post("/update-profile", updateUserProfile);

// Update user resume
userRouter.post("/update-resume", uploadResume.single("resume"), updateUserResume);

// Extract resume data
userRouter.post("/extract-resume-data", extractResumeData);

// Fix user data
userRouter.get("/fix-user-data", fixUserData);

// Force refresh user data
userRouter.post("/force-refresh", forceRefreshUserData);

// DELETE endpoint to delete user's resume
userRouter.delete('/delete-resume', async (req, res) => {
  try {
    console.log('=== DELETE RESUME ENDPOINT CALLED ===');
    
    // Get userId from Clerk auth - it's in req.auth.userId, not req.userId
    const clerkUserId = req.auth?.userId;
    
    console.log('Clerk User ID:', clerkUserId);
    
    if (!clerkUserId) {
      console.log('No userId found in req.auth');
      return res.json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Find the user in database by _id (which is the Clerk ID in your model)
    const user = await User.findById(clerkUserId);
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found in database with ID:', clerkUserId);
      return res.json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('User resume path:', user.resume);

    // Check if user has a resume
    if (!user.resume) {
      console.log('No resume field in user document');
      return res.json({ 
        success: false, 
        message: 'No resume found to delete' 
      });
    }

    // Delete the physical file from uploads folder
    try {
      // user.resume is like "/uploads/resumes/resume_user_xxxxx.pdf"
      // Remove leading slash if present
      const resumePath = user.resume.startsWith('/') ? user.resume.substring(1) : user.resume;
      
      // Construct the full file path
      const filePath = path.join(__dirname, '..', resumePath);
      
      console.log('Attempting to delete file:', filePath);
      
      // Check if file exists and delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✓ Resume file deleted from disk');
      } else {
        console.log('⚠ Resume file not found on disk (will still clear from DB)');
      }
    } catch (fileError) {
      console.error('Error deleting file from disk:', fileError);
      // Continue even if file deletion fails - still clear from database
    }

    // Clear resume field in database
    user.resume = null;
    await user.save();
    
    console.log('✓ Resume field cleared in database');

    return res.json({ 
      success: true, 
      message: 'Resume deleted successfully' 
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    return res.json({ 
      success: false, 
      message: 'Failed to delete resume. Please try again.' 
    });
  }
});

export default userRouter;