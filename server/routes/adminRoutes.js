import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuthMiddleware.js';
import {
  loginAdmin,
  getAdminProfile,
  getStats,
  getUsers,
  deleteUser,
  getCompanies,
  deleteCompany,
  getJobs,
  deleteJob,
  toggleJobVisibility,
  getApplications,
  deleteApplication,
  getInquiries,
  replyToInquiry,
  deleteInquiry,
} from '../controller/adminController.js';

const router = express.Router();

// Public
router.post('/login', loginAdmin);

// Protected — all routes below require admin token
router.use(adminAuthMiddleware);

router.get('/profile', getAdminProfile);
router.get('/stats', getStats);

// Users
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Companies
router.get('/companies', getCompanies);
router.delete('/companies/:id', deleteCompany);

// Jobs
router.get('/jobs', getJobs);
router.delete('/jobs/:id', deleteJob);
router.patch('/jobs/:id/visibility', toggleJobVisibility);

// Applications
router.get('/applications', getApplications);
router.delete('/applications/:id', deleteApplication);

// Inquiries
router.get('/inquiries', getInquiries);
router.post('/inquiries/:id/reply', replyToInquiry);
router.delete('/inquiries/:id', deleteInquiry);

export default router;
