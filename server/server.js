// import './config/instrument.js';
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import 'dotenv/config';
import connectDB from "./config/db.js";
// import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controller/webhooks.js';
import companyRoutes from './routes/companyRoutes.js';
import JobRoutes from './routes/jobRoutes.js';
import jobAlertRoutes from './routes/JobAlert.js';
import userRoutes from './routes/userRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import companyAuthMiddleware from './middleware/companyAuthMiddleware.js';
import { startJobAlertSystem } from './services/jobAlerts.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import employerProfileRoutes from './routes/employerProfileRoutes.js';
import bulkUpload from './routes/bulkUpload.js';
import adminRoutes from './routes/adminRoutes.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { sendDailyDigestAt9AM } from './services/jobNotificationService.js'; 

// NEW
import { initializeCronJobs } from './cronJobs.mjs';
initializeCronJobs();
// Create uploads directories
const uploadsDir = path.join(__dirname, 'uploads');
const resumesDir = path.join(__dirname, 'uploads', 'resumes');
const imagesDir = path.join(__dirname, 'uploads', 'images');
const tempDir = path.join(__dirname, 'uploads', 'temp');

[uploadsDir, resumesDir, imagesDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

await connectDB();
startJobAlertSystem();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(clerkMiddleware());

// Serve static files
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.get("/", (req, res) => res.send("API Working"));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-digest', async (req, res) => {
  const result = await sendDailyDigestAt9AM();
  res.json(result);
});
//app.get("/debug-sentry", function mainHandler(req, res) {
 // throw new Error("My first Sentry error!");
//});

// Routes
app.post('/webhooks', clerkWebhooks);
app.use('/api/company', companyRoutes);
app.use('/api/bulk-upload', bulkUpload);
app.use('/api/jobs', JobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employer', employerProfileRoutes);
app.use('/api/job-alerts', jobAlertRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Sentry error handler (must be after all routes)
//Sentry.setupExpressErrorHandler(app);

// Global error handler (must be after Sentry)// Global error handler (must be after Sentry)
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    
    let message = 'This information is already registered.';
    if (field === 'phone') {
      message = 'This phone number is already registered with another account. Please use a different phone number.';
    } else if (field === 'email') {
      message = 'This email is already registered. Please try logging in instead.';
    }
    
    return res.json({
      success: false,
      message: message
    });
  }
   
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});
