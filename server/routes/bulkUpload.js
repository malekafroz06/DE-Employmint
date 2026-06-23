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
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

// File filter
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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 20
  },
  fileFilter: fileFilter
});

// ─── Middleware: Verify Company Token ────────────────────────────────────────
const verifyCompanyToken = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required. Please login." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.isSubUser) {
      req.companyId = new mongoose.Types.ObjectId(decoded.parentCompanyId);
      req.companyIdString = decoded.parentCompanyId.toString();
      req.isSubUser = true;
      req.subUserId = decoded.id;
      req.subUserRole = decoded.roleType;
      console.log('Verified sub-user:', req.subUserRole, 'Parent company ID:', req.companyId);
      return next();
    }
    
    const companyIdString = decoded.id || decoded._id;
    if (!companyIdString) {
      return res.status(401).json({ success: false, message: "Invalid token format" });
    }
    
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

// ─── Middleware: Require Bulk Upload Permission ───────────────────────────────
const requireBulkUploadPermission = async (req, res, next) => {
  if (!req.isSubUser) {
    return next();
  }
  try {
    const subUser = await SubUser.findById(req.subUserId);
    if (!subUser) {
      return res.status(403).json({ success: false, message: 'Sub-user not found' });
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

// ─── Helper: Build $or query for companyId (handles ObjectId vs String mismatch) ─
const companyIdQuery = (companyId) => ({
  $or: [
    { companyId: companyId },
    { companyId: companyId.toString() }
  ]
});

// ─── POST /upload-resumes ─────────────────────────────────────────────────────
router.post('/upload-resumes', verifyCompanyToken, requireBulkUploadPermission, (req, res) => {
  upload.array('resumes', 20)(req, res, async (err) => {
    console.log('=== Resume Upload Request ===');
    console.log('Files received:', req.files?.length || 0);

    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: "File size exceeds 15MB limit" });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: "Maximum 20 files allowed at once" });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: "Unexpected field in upload. Use 'resumes' as the field name." });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded. Please select resume files to upload." });
      }

      const uploadBatch = Date.now().toString();
      const uploadedResumes = [];
      let processedCount = 0;
      let failedCount = 0;

      for (const file of req.files) {
        try {
          const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
          let extractedText = '';
          let parsedData = {};

          try {
            extractedText = await ResumeProcessor.extractTextFromFile(file.path, fileExt);
            parsedData = ResumeProcessor.parseResumeData(extractedText);
          } catch (parseError) {
            console.error('Error parsing resume:', file.originalname, parseError);
          }

          // Deduplication: check for existing resume with same name for this company
          const existing = await Resume.findOne({
            ...companyIdQuery(req.companyId),
            originalName: file.originalname
          });

          let resume;
          if (existing) {
            const oldFilePath = existing.filePath;
            resume = await Resume.findOneAndUpdate(
              { _id: existing._id },
              {
                $set: {
                  fileName: file.filename,
                  fileSize: file.size,
                  fileType: fileExt,
                  filePath: file.path,
                  extractedText,
                  parsedData,
                  status: 'processed',
                  'metadata.uploadBatch': uploadBatch
                }
              },
              { new: true }
            );
            if (oldFilePath && oldFilePath !== file.path) {
              try { await fs.unlink(oldFilePath); } catch {}
            }
          } else {
            resume = new Resume({
              companyId: req.companyId,
              fileName: file.filename,
              originalName: file.originalname,
              fileSize: file.size,
              fileType: fileExt,
              filePath: file.path,
              extractedText,
              parsedData,
              status: 'processed',
              metadata: { uploadBatch }
            });
            await resume.save();
          }

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
            // Don't overwrite an existing successfully processed record with a failed one
            const existing = await Resume.findOne({
              ...companyIdQuery(req.companyId),
              originalName: file.originalname,
              status: 'processed'
            });
            if (!existing) {
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
                metadata: { uploadBatch, processingNotes: error.message }
              });
              await resume.save();
              uploadedResumes.push({
                id: resume._id,
                originalName: file.originalname,
                size: file.size,
                status: 'failed',
                error: error.message
              });
            }
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
      res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
  });
});

// ─── POST /upload-csv ─────────────────────────────────────────────────────────
router.post('/upload-csv', verifyCompanyToken, requireBulkUploadPermission, (req, res) => {
  upload.array('csvFiles', 10)(req, res, async (err) => {
    console.log('=== CSV/Excel Upload Request ===');
    console.log('Files received:', req.files?.length || 0);

    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: "File size exceeds 15MB limit" });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: "Maximum 10 files allowed at once" });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: "Unexpected field in upload. Use 'csvFiles' as the field name." });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded. Please select CSV or Excel files to upload." });
      }

      const uploadBatch = Date.now().toString();
      const uploadedFiles = [];
      let processedCount = 0;
      let failedCount = 0;

      for (const file of req.files) {
        try {
          const fileExt = path.extname(file.originalname).toLowerCase();
          let processedData;

          if (fileExt === '.csv') {
            processedData = await CSVProcessor.processCSVFile(file.path);
          } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            processedData = await CSVProcessor.processExcelFile(file.path);
          } else {
            throw new Error('Unsupported file type');
          }

          const validation = CSVProcessor.validateCSVData(processedData);
          if (!validation.isValid) {
            throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
          }

          // Deduplication: check for existing CSV with same name for this company
          const existingCsv = await CsvData.findOne({
            ...companyIdQuery(req.companyId),
            originalName: file.originalname
          });

          let dataRecord;
          if (existingCsv) {
            const oldFilePath = existingCsv.filePath;
            dataRecord = await CsvData.findOneAndUpdate(
              { _id: existingCsv._id },
              {
                $set: {
                  fileName: file.filename,
                  fileSize: file.size,
                  fileType: fileExt.substring(1),
                  filePath: file.path,
                  totalRows: processedData.totalRows,
                  processedRows: processedData.totalRows,
                  headers: processedData.headers,
                  data: processedData.data,
                  status: 'processed',
                  'metadata.uploadBatch': uploadBatch,
                  'metadata.dataType': req.body.dataType || 'general'
                }
              },
              { new: true }
            );
            if (oldFilePath && oldFilePath !== file.path) {
              try { await fs.unlink(oldFilePath); } catch {}
            }
          } else {
            dataRecord = new CsvData({
              companyId: req.companyId,
              fileName: file.filename,
              originalName: file.originalname,
              fileSize: file.size,
              fileType: fileExt.substring(1),
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
          }

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
            // Don't overwrite an existing successfully processed record with a failed one
            const existingCsv = await CsvData.findOne({
              ...companyIdQuery(req.companyId),
              originalName: file.originalname,
              status: 'processed'
            });
            if (!existingCsv) {
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
                metadata: { uploadBatch, processingNotes: error.message }
              });
              await dataRecord.save();
              uploadedFiles.push({
                id: dataRecord._id,
                originalName: file.originalname,
                size: file.size,
                status: 'failed',
                error: error.message
              });
            }
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
      res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
  });
});

// ─── POST /reject/:id ─────────────────────────────────────────────────────────
router.post('/reject/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const updated = await Resume.findOneAndUpdate(
      { _id: req.params.id, ...companyIdQuery(req.companyId) },
      { $set: { rejected: true, accepted: false } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }
    res.json({ success: true, message: "Candidate rejected successfully", data: { rejected: updated.rejected, accepted: updated.accepted } });
  } catch (error) {
    console.error('Reject candidate error:', error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// ─── POST /unreject/:id ───────────────────────────────────────────────────────
router.post('/unreject/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const updated = await Resume.findOneAndUpdate(
      { _id: req.params.id, ...companyIdQuery(req.companyId) },
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

// ─── POST /accept/:id ─────────────────────────────────────────────────────────
router.post('/accept/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const updated = await Resume.findOneAndUpdate(
      { _id: req.params.id, ...companyIdQuery(req.companyId) },
      { $set: { accepted: true, rejected: false, assessmentData: req.body.assessmentData || {} } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }
    res.json({ success: true, message: "Candidate accepted successfully", data: { rejected: updated.rejected, accepted: updated.accepted } });
  } catch (error) {
    console.error('Accept candidate error:', error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// ─── GET /files ───────────────────────────────────────────────────────────────
router.get('/files', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const idQuery = companyIdQuery(req.companyId);

    // Debug log — remove after confirming fix
    console.log('=== GET /files ===');
    console.log('type:', type);
    console.log('companyId:', req.companyId, typeof req.companyId);

    let files = [];
    let totalCount = 0;

    if (type === 'resumes') {
      const resumes = await Resume.find(idQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-extractedText')
        .lean();

      totalCount = await Resume.countDocuments(idQuery);

      files = resumes.map(resume => ({
        ...resume,
        rejected: resume.rejected === true,
        accepted: resume.accepted === true,
        fileCategory: 'resume'
      }));

    } else if (type === 'csv') {
      const csvFiles = await CsvData.find(idQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-data');

      totalCount = await CsvData.countDocuments(idQuery);

      files = csvFiles.map(csv => ({
        ...csv.toObject(),
        fileCategory: 'csv'
      }));
    }

    console.log(`Found ${files.length} files, totalCount: ${totalCount}`);

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
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// ─── DELETE /files/:id ────────────────────────────────────────────────────────
router.delete('/files/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const idQuery = companyIdQuery(req.companyId);

    let deletedFile = null;

    if (type === 'resume') {
      deletedFile = await Resume.findOneAndDelete({ _id: id, ...idQuery });
    } else if (type === 'csv') {
      deletedFile = await CsvData.findOneAndDelete({ _id: id, ...idQuery });
    }

    if (!deletedFile) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    try {
      await fs.unlink(deletedFile.filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }

    res.json({ success: true, message: "File deleted successfully" });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// ─── GET /download/:id ────────────────────────────────────────────────────────
router.get('/download/:id', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const idQuery = companyIdQuery(req.companyId);

    let file = await Resume.findOne({ _id: id, ...idQuery });
    if (!file) {
      file = await CsvData.findOne({ _id: id, ...idQuery });
    }

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const fsSync = await import('fs');
    if (!fsSync.default.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, message: "Physical file not found" });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fsSync.default.createReadStream(file.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ success: false, message: "Internal server error: " + error.message });
  }
});

// ─── GET /stats ───────────────────────────────────────────────────────────────
router.get('/stats', verifyCompanyToken, requireBulkUploadPermission, async (req, res) => {
  try {
    console.log('=== Stats Request ===');
    console.log('CompanyId (ObjectId):', req.companyId);
    console.log('CompanyId type:', typeof req.companyId);

    const idQuery = companyIdQuery(req.companyId);

    const directResumeCount = await Resume.countDocuments(idQuery);
    const directCsvCount = await CsvData.countDocuments(idQuery);

    console.log('Direct Resume Count:', directResumeCount);
    console.log('Direct CSV/Excel Count:', directCsvCount);

    if (directResumeCount === 0 && directCsvCount === 0) {
      return res.json({
        success: true,
        data: {
          resumes: { totalResumes: 0, processedResumes: 0, failedResumes: 0, totalSize: 0 },
          csv: { totalCSVs: 0, processedCSVs: 0, failedCSVs: 0, totalRows: 0, totalSize: 0 }
        }
      });
    }

    const [resumeStatsResult, csvStatsResult] = await Promise.allSettled([
      Resume.aggregate([
        { $match: idQuery },
        {
          $group: {
            _id: null,
            totalResumes: { $sum: 1 },
            processedResumes: { $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] } },
            failedResumes: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            totalSize: { $sum: "$fileSize" }
          }
        }
      ]),
      CsvData.aggregate([
        { $match: idQuery },
        {
          $group: {
            _id: null,
            totalCSVs: { $sum: 1 },
            processedCSVs: { $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] } },
            failedCSVs: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            totalRows: { $sum: "$totalRows" },
            totalSize: { $sum: "$fileSize" }
          }
        }
      ])
    ]);

    let resumeStats = { totalResumes: directResumeCount, processedResumes: 0, failedResumes: 0, totalSize: 0 };
    let csvStats = { totalCSVs: directCsvCount, processedCSVs: 0, failedCSVs: 0, totalRows: 0, totalSize: 0 };

    if (resumeStatsResult.status === 'fulfilled' && resumeStatsResult.value?.[0]) {
      resumeStats = resumeStatsResult.value[0];
    }
    if (csvStatsResult.status === 'fulfilled' && csvStatsResult.value?.[0]) {
      csvStats = csvStatsResult.value[0];
    }

    console.log('Final stats:', { resumeStats, csvStats });

    res.json({ success: true, data: { resumes: resumeStats, csv: csvStats } });

  } catch (error) {
    console.error('Get stats error:', error);
    res.json({
      success: true,
      data: {
        resumes: { totalResumes: 0, processedResumes: 0, failedResumes: 0, totalSize: 0 },
        csv: { totalCSVs: 0, processedCSVs: 0, failedCSVs: 0, totalRows: 0, totalSize: 0 }
      }
    });
  }
});

export default router;