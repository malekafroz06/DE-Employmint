import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import CsvData from '../models/CsvData.js';  
import ResumeProcessor from '../utils/resumeProcessor.js';
import CSVProcessor from '../utils/csvProcessor.js';
import SubUser from '../models/SubUser.js';
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const createUploadDirs = async () => {
  const dirs = ['uploads/resumes', 'uploads/csvs'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Initialize upload directories
await createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resumes') {
      cb(null, 'uploads/resumes');
    } else if (file.fieldname === 'csvFiles') {
      cb(null, 'uploads/csvs');
    } else {
      cb(new Error('Invalid field name'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

// File filter - UPDATED to support Excel files
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resumes') {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    file.mimetype === 'application/msword';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'));
    }
  } else if (file.fieldname === 'csvFiles') {
    // Support CSV and Excel files
    const allowedTypes = /csv|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'text/csv' || 
                    file.mimetype === 'application/csv' ||
                    file.mimetype === 'text/plain' ||
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files (CSV, XLSX, XLS) are allowed'));
    }
  } else {
    cb(new Error('Invalid field name'));
  }
};

// UPDATED: Increased file size limit for CSV/Excel files
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file (increased for Excel files)
    files: 20 // Maximum 20 files at once
  },
  fileFilter: fileFilter
});

// Middleware to verify company token
const verifyCompanyToken = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required. Please login." });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ NEW: Check if it's a sub-user
    if (decoded.isSubUser) {
      // This is a sub-user
      req.companyId = new mongoose.Types.ObjectId(decoded.parentCompanyId);
      req.companyIdString = decoded.parentCompanyId.toString();
      req.isSubUser = true;
      req.subUserId = decoded.id;
      req.subUserRole = decoded.roleType;
      
      console.log('Verified sub-user:', req.subUserRole, 'Parent company ID:', req.companyId);
      return next();
    }
    
    // ✅ ORIGINAL: Main company login
    const companyIdString = decoded.id || decoded._id;
    if (!companyIdString) {
      return res.status(401).json({ success: false, message: "Invalid token format" });
    }
    
    // Convert to ObjectId and store both formats
    req.companyId = new mongoose.Types.ObjectId(companyIdString);
    req.companyIdString = companyIdString.toString();
    req.isSubUser = false;
    
    console.log('Verified company ID:', req.companyId);
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token. Please login again." });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token expired. Please login again." });
    }
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};
const requireBulkUploadPermission = async (req, res, next) => {
  // Main company always has permission
  if (!req.isSubUser) {
    return next();
  }

  // Check sub-user permission
  try {
    const subUser = await SubUser.findById(req.subUserId);
    
    if (!subUser) {
      return res.status(403).json({
        success: false,
        message: 'Sub-user not found'
      });
    }

    if (!subUser.permissions?.canManageBulkUpload) {
      return res.status(403).json({
        success: false,
        message: `${req.subUserRole?.toUpperCase()} users need "Bulk Upload & Search Resume" permission. Contact your admin to grant access.`
      });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ success: false, message: 'Error checking permissions' });
  }
};
// Bulk Resume Upload
router.post('/upload-resumes', verifyCompanyToken,requireBulkUploadPermission, (req, res) => {
  upload.array('resumes', 20)(req, res, async (err) => {
    // Enhanced error logging
    console.log('=== Resume Upload Request ===');
    console.log('Files received:', req.files?.length || 0);
   
    
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: "File size exceeds 400KB limit" 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          success: false, 
          message: "Maximum 20 files allowed at once" 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          success: false, 
          message: "Unexpected field in upload. Use 'resumes' as the field name." 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        console.log('No files in request');
        return res.status(400).json({ 
          success: false, 
          message: "No files uploaded. Please select resume files to upload." 
        });
      }

      const uploadBatch = Date.now().toString();
      const uploadedResumes = [];
      let processedCount = 0;
      let failedCount = 0;

      // Process each uploaded resume
      for (const file of req.files) {
        try {
          // Extract text from resume
          const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
          let extractedText = '';
          let parsedData = {};

          try {
            extractedText = await ResumeProcessor.extractTextFromFile(file.path, fileExt);
            parsedData = ResumeProcessor.parseResumeData(extractedText);
          } catch (parseError) {
            console.error('Error parsing resume:', file.originalname, parseError);
          }

          // Save to database with ObjectId companyId
          const resume = new Resume({
            companyId: req.companyId,
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            fileType: fileExt,
            filePath: file.path,
            extractedText,
            parsedData,
            status: 'processed',
            metadata: {
              uploadBatch
            }
          });

          await resume.save();
          processedCount++;
          
          uploadedResumes.push({
            id: resume._id,
            originalName: file.originalname,
            size: file.size,
            status: 'processed'
          });

        } catch (error) {
          console.error('Error processing resume:', file.originalname, error);
          failedCount++;
          
          try {
            const resume = new Resume({
              companyId: req.companyId,
              fileName: file.filename,
              originalName: file.originalname,
              fileSize: file.size,
              fileType: path.extname(file.originalname).substring(1).toLowerCase(),
              filePath: file.path,
              extractedText: '',
              parsedData: {},
              status: 'failed',
              metadata: {
                uploadBatch,
                processingNotes: error.message
              }
            });

            await resume.save();
            uploadedResumes.push({
              id: resume._id,
              originalName: file.originalname,
              size: file.size,
              status: 'failed',
              error: error.message
            });
          } catch (saveError) {
            console.error('Error saving failed resume:', saveError);
          }
        }
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${req.files.length} resume(s). ${processedCount} processed, ${failedCount} failed.`,
        data: {
          uploadBatch,
          totalFiles: req.files.length,
          processedFiles: processedCount,
          failedFiles: failedCount,
          files: uploadedResumes
        }
      });

    } catch (error) {
      console.error('Bulk resume upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error: " + error.message 
      });
    }
  });
});

// Bulk CSV/Excel Upload - UPDATED
router.post('/upload-csv', verifyCompanyToken,requireBulkUploadPermission, (req, res) => {
  upload.array('csvFiles', 10)(req, res, async (err) => {
    // Enhanced error logging
    console.log('=== CSV/Excel Upload Request ===');
    console.log('Files received:', req.files?.length || 0);
    
    
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: "File size exceeds 5MB limit" 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          success: false, 
          message: "Maximum 10 files allowed at once" 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          success: false, 
          message: "Unexpected field in upload. Use 'csvFiles' as the field name." 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        console.log('No files in request');
        return res.status(400).json({ 
          success: false, 
          message: "No files uploaded. Please select CSV or Excel files to upload." 
        });
      }

      const uploadBatch = Date.now().toString();
      const uploadedFiles = [];
      let processedCount = 0;
      let failedCount = 0;

      // Process each uploaded file
      for (const file of req.files) {
        try {
          const fileExt = path.extname(file.originalname).toLowerCase();
          let processedData;

          // Process based on file type
          if (fileExt === '.csv') {
            processedData = await CSVProcessor.processCSVFile(file.path);
          } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            // Process Excel file - will need Excel processor
            processedData = await CSVProcessor.processExcelFile(file.path);
          } else {
            throw new Error('Unsupported file type');
          }

          const validation = CSVProcessor.validateCSVData(processedData);

          if (!validation.isValid) {
            throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
          }

          // Save to database with ObjectId companyId
          const dataRecord = new CsvData({
            companyId: req.companyId,
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            fileType: fileExt.substring(1), // Store file extension
            filePath: file.path,
            totalRows: processedData.totalRows,
            processedRows: processedData.totalRows,
            headers: processedData.headers,
            data: processedData.data,
            status: 'processed',
            metadata: {
              uploadBatch,
              dataType: req.body.dataType || 'general'
            }
          });

          await dataRecord.save();
          processedCount++;
          
          uploadedFiles.push({
            id: dataRecord._id,
            originalName: file.originalname,
            size: file.size,
            totalRows: processedData.totalRows,
            headers: processedData.headers,
            status: 'processed'
          });

        } catch (error) {
          console.error('Error processing file:', file.originalname, error);
          failedCount++;
          
          try {
            const dataRecord = new CsvData({
              companyId: req.companyId,
              fileName: file.filename,
              originalName: file.originalname,
              fileSize: file.size,
              fileType: path.extname(file.originalname).substring(1).toLowerCase(),
              filePath: file.path,
              totalRows: 0,
              processedRows: 0,
              headers: [],
              data: [],
              status: 'failed',
              metadata: {
                uploadBatch,
                processingNotes: error.message
              }
            });

            await dataRecord.save();
            uploadedFiles.push({
              id: dataRecord._id,
              originalName: file.originalname,
              size: file.size,
              status: 'failed',
              error: error.message
            });
          } catch (saveError) {
            console.error('Error saving failed file:', saveError);
          }
        }
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${req.files.length} file(s). ${processedCount} processed, ${failedCount} failed.`,
        data: {
          uploadBatch,
          totalFiles: req.files.length,
          processedFiles: processedCount,
          failedFiles: failedCount,
          files: uploadedFiles
        }
      });

    } catch (error) {
      console.error('Bulk file upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error: " + error.message 
      });
    }
  });
});
// Reject a candidate (persist in DB)
router.post('/reject/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const updated = await Resume.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { rejected: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    res.json({ success: true, message: "Candidate rejected successfully" });
  } catch (error) {
    console.error('Reject candidate error:', error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// Undo reject
router.post('/unreject/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const updated = await Resume.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { rejected: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    res.json({ success: true, message: "Candidate unrejected successfully" });
  } catch (error) {
    console.error('Unreject candidate error:', error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// Mark candidate as accepted with assessment data
router.post('/accept/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const updated = await Resume.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { accepted: true, assessmentData: req.body.assessmentData || {} },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    res.json({ success: true, message: "Candidate accepted successfully" });
  } catch (error) {
    console.error('Accept candidate error:', error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// Get uploaded files for a company
router.get('/files', verifyCompanyToken, requireBulkUploadPermission,async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let files = [];
    let totalCount = 0;

    if (type === 'resumes') {
      const resumes = await Resume.find({ companyId: req.companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-extractedText');

      const resumeCount = await Resume.countDocuments({ companyId: req.companyId });
      
      files = resumes.map(resume => ({
        ...resume.toObject(),
        fileCategory: 'resume'
      }));
      totalCount = resumeCount;
    } else if (type === 'csv') {
      const csvFiles = await CsvData.find({ companyId: req.companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-data');

      const csvCount = await CsvData.countDocuments({ companyId: req.companyId });
      
      files = csvFiles.map(csv => ({
        ...csv.toObject(),
        fileCategory: 'csv'
      }));
      totalCount = csvCount;
    }

    res.json({
      success: true,
      data: {
        files,
        totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error: " + error.message 
    });
  }
});

// Delete uploaded file
router.delete('/files/:id', verifyCompanyToken,requireBulkUploadPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let deletedFile = null;

    if (type === 'resume') {
      deletedFile = await Resume.findOneAndDelete({ 
        _id: id, 
        companyId: req.companyId 
      });
    } else if (type === 'csv') {
      deletedFile = await CsvData.findOneAndDelete({ 
        _id: id, 
        companyId: req.companyId 
      });
    }

    if (!deletedFile) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found" 
      });
    }

    // Delete physical file
    try {
      await fs.unlink(deletedFile.filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }

    res.json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error: " + error.message 
    });
  }
});

// Download uploaded file
router.get('/download/:id', verifyCompanyToken,requireBulkUploadPermission, async (req, res) => {
  try {
    const { id } = req.params;
    let file = null;

    file = await Resume.findOne({ _id: id, companyId: req.companyId });
    if (!file) {
      file = await CsvData.findOne({ _id: id, companyId: req.companyId });
    }

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found" 
      });
    }

    const fsSync = await import('fs');
    if (!fsSync.default.existsSync(file.filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "Physical file not found" 
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fsSync.default.createReadStream(file.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error: " + error.message 
    });
  }
});

// Get file statistics
router.get('/stats', verifyCompanyToken,requireBulkUploadPermission, async (req, res) => {
  try {
    console.log('=== Stats Request ===');
    console.log('CompanyId (ObjectId):', req.companyId);
    console.log('CompanyId type:', typeof req.companyId);

    // Direct count first to verify data exists
    const directResumeCount = await Resume.countDocuments({ companyId: req.companyId });
    const directCsvCount = await CsvData.countDocuments({ companyId: req.companyId });
    
    console.log('Direct Resume Count:', directResumeCount);
    console.log('Direct CSV/Excel Count:', directCsvCount);

    // If no data, return zeros immediately
    if (directResumeCount === 0 && directCsvCount === 0) {
      return res.json({
        success: true,
        data: {
          resumes: {
            totalResumes: 0,
            processedResumes: 0,
            failedResumes: 0,
            totalSize: 0
          },
          csv: {
            totalCSVs: 0,
            processedCSVs: 0,
            failedCSVs: 0,
            totalRows: 0,
            totalSize: 0
          }
        }
      });
    }

    // Run aggregations
    const [resumeStatsResult, csvStatsResult] = await Promise.allSettled([
      Resume.aggregate([
        { 
          $match: { 
            companyId: req.companyId 
          } 
        },
        {
          $group: {
            _id: null,
            totalResumes: { $sum: 1 },
            processedResumes: {
              $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] }
            },
            failedResumes: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
            },
            totalSize: { $sum: "$fileSize" }
          }
        }
      ]),
      
      CsvData.aggregate([
        { 
          $match: { 
            companyId: req.companyId 
          } 
        },
        {
          $group: {
            _id: null,
            totalCSVs: { $sum: 1 },
            processedCSVs: {
              $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] }
            },
            failedCSVs: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
            },
            totalRows: { $sum: "$totalRows" },
            totalSize: { $sum: "$fileSize" }
          }
        }
      ])
    ]);

    console.log('Resume aggregation result:', resumeStatsResult);
    console.log('CSV/Excel aggregation result:', csvStatsResult);

    // Extract results with fallbacks
    let resumeStats = {
      totalResumes: directResumeCount,
      processedResumes: 0,
      failedResumes: 0,
      totalSize: 0
    };

    let csvStats = {
      totalCSVs: directCsvCount,
      processedCSVs: 0,
      failedCSVs: 0,
      totalRows: 0,
      totalSize: 0
    };

    // Use aggregation results if successful
    if (resumeStatsResult.status === 'fulfilled' && resumeStatsResult.value && resumeStatsResult.value[0]) {
      resumeStats = resumeStatsResult.value[0];
    }

    if (csvStatsResult.status === 'fulfilled' && csvStatsResult.value && csvStatsResult.value[0]) {
      csvStats = csvStatsResult.value[0];
    }

    console.log('Final stats:', { resumeStats, csvStats });

    res.json({
      success: true,
      data: {
        resumes: resumeStats,
        csv: csvStats
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    console.error('Error stack:', error.stack);
    
    // Return empty stats on error
    res.json({ 
      success: true, 
      data: {
        resumes: {
          totalResumes: 0,
          processedResumes: 0,
          failedResumes: 0,
          totalSize: 0
        },
        csv: {
          totalCSVs: 0,
          processedCSVs: 0,
          failedCSVs: 0,
          totalRows: 0,
          totalSize: 0
        }
      }
    });
  }
});

export default router;