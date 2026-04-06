import express from 'express';
import CandidateAssessment from '../models/CandidateAssessment.js';

const router = express.Router();

// @desc    Get existing assessment by email  
// @route   GET /api/candidates/assessment/email/:email
// @access  Public
router.get('/assessment/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('Fetching assessment for email:', email);
    
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    // Find assessment by candidate email
    const assessment = await CandidateAssessment.findOne({ 
      candidateEmail: email.toLowerCase().trim() 
    });
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'No assessment found for this candidate'
      });
    }
    
    console.log('Found assessment:', assessment._id);
    
    res.json({
      success: true,
      assessment: assessment
    });
    
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Create new candidate assessment or update existing one
// @route   POST /api/candidates/assessment
// @access  Public
router.post('/assessment', async (req, res) => {
  try {
    console.log('=== Candidate Assessment Submission ===');
    console.log('Request body:', req.body);

    const {
      candidateName,
      candidateEmail,
      candidatePhone,
      remarkEntry,
      // Legacy step data (kept for backward compatibility)
      consultancy,
      financialStatus,
      dailyCommute,
      aspirations,
      moneyAttitude,
      loyaltyBehavior,
      workStyle,
      pressureHandling,
      roleClarityNeed,
      fear1,
      motivation1,
      challenge1,
      powerLanguage1,
      companyPriority1,
      targets,
      references,
      softwares,
      productKnowledge,
      sourceOfRevenue
    } = req.body;

    // Validate required field
    if (!candidateName || !candidateName.trim()) {
      console.log('Validation failed: candidateName is required');
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required'
      });
    }

    // Check if assessment already exists for this email
    let existingAssessment = null;
    if (candidateEmail && candidateEmail.trim()) {
      existingAssessment = await CandidateAssessment.findOne({ 
        candidateEmail: candidateEmail.toLowerCase().trim()
      });
    }

    const currentDate = new Date();

    if (existingAssessment) {
      console.log('Assessment exists, updating...');

      const updateData = {
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail ? candidateEmail.toLowerCase().trim() : undefined,
        candidatePhone: candidatePhone ? candidatePhone.trim() : undefined,
        consultancy,
        financialStatus,
        dailyCommute,
        aspirations,
        moneyAttitude,
        loyaltyBehavior,
        workStyle,
        pressureHandling,
        roleClarityNeed,
        fear1,
        motivation1,
        challenge1,
        powerLanguage1,
        companyPriority1,
        targets,
        references,
        softwares,
        productKnowledge,
        sourceOfRevenue,
        assessmentStatus: 'completed',
        lastUpdated: currentDate,
        lastContactedDate: currentDate
      };

      // Handle remark entry: replace existing remark for same role or push new
      let updatedAssessment;
      if (remarkEntry && remarkEntry.role && remarkEntry.text) {
        // Remove existing remark for this role then push new one
        await CandidateAssessment.findByIdAndUpdate(
          existingAssessment._id,
          { $pull: { remarks: { role: remarkEntry.role } } }
        );
        updatedAssessment = await CandidateAssessment.findByIdAndUpdate(
          existingAssessment._id,
          {
            ...updateData,
            $push: { remarks: { role: remarkEntry.role, text: remarkEntry.text, submittedAt: currentDate } }
          },
          { new: true, runValidators: false }
        );
      } else {
        updatedAssessment = await CandidateAssessment.findByIdAndUpdate(
          existingAssessment._id,
          updateData,
          { new: true, runValidators: true }
        );
      }

      console.log('Assessment updated successfully:');
      
      return res.json({
        success: true,
        message: 'Assessment updated successfully',
        data: {
          id: updatedAssessment._id,
          candidateName: updatedAssessment.candidateName,
          lastUpdated: updatedAssessment.lastUpdated,
          lastContactedDate: updatedAssessment.lastContactedDate
        }
      });
    }

    console.log('Creating new assessment...');

    const remarksArray = (remarkEntry && remarkEntry.role && remarkEntry.text)
      ? [{ role: remarkEntry.role, text: remarkEntry.text, submittedAt: currentDate }]
      : [];

    // Create new assessment
    const assessment = new CandidateAssessment({
      candidateName: candidateName.trim(),
      candidateEmail: candidateEmail ? candidateEmail.toLowerCase().trim() : undefined,
      candidatePhone: candidatePhone ? candidatePhone.trim() : undefined,
      remarks: remarksArray,
      consultancy,
      financialStatus,
      dailyCommute,
      aspirations,
      moneyAttitude,
      loyaltyBehavior,
      workStyle,
      pressureHandling,
      roleClarityNeed,
      fear1,
      motivation1,
      challenge1,
      powerLanguage1,
      companyPriority1,
      targets,
      references,
      softwares,
      productKnowledge,
      sourceOfRevenue,
      assessmentStatus: 'completed',
      lastContactedDate: currentDate
    });

    const savedAssessment = await assessment.save();
    console.log('Assessment saved successfully:');

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        id: savedAssessment._id,
        candidateName: savedAssessment.candidateName,
        submittedAt: savedAssessment.submittedAt,
        lastContactedDate: savedAssessment.lastContactedDate
      }
    });

  } catch (error) {
    console.error('Error creating/updating assessment:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while processing assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update existing candidate assessment
// @route   PUT /api/candidates/assessment/email/:email
// @access  Public
router.put('/assessment/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const assessmentData = req.body;
    
    console.log('Updating assessment for email:', email);
    console.log('Update data:', assessmentData);
    
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    // Validate required field
    if (!assessmentData.candidateName || !assessmentData.candidateName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required'
      });
    }
    
    // Ensure email consistency and clean data
    if (assessmentData.candidateEmail) {
      assessmentData.candidateEmail = assessmentData.candidateEmail.toLowerCase().trim();
    }
    if (assessmentData.candidateName) {
      assessmentData.candidateName = assessmentData.candidateName.trim();
    }
    if (assessmentData.candidatePhone) {
      assessmentData.candidatePhone = assessmentData.candidatePhone.trim();
    }
    
    // Update timestamps
    const currentDate = new Date();
    assessmentData.lastUpdated = currentDate;
    assessmentData.lastContactedDate = currentDate; // Update last contacted date
    assessmentData.assessmentStatus = 'completed';
    
    // Find and update the assessment
    const updatedAssessment = await CandidateAssessment.findOneAndUpdate(
      { candidateEmail: email.toLowerCase().trim() },
      assessmentData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validation
      }
    );
    
    if (!updatedAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found for this candidate'
      });
    }
    
    console.log('Assessment updated successfully:', updatedAssessment._id);
    
    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: {
        id: updatedAssessment._id,
        candidateName: updatedAssessment.candidateName,
        lastUpdated: updatedAssessment.lastUpdated,
        lastContactedDate: updatedAssessment.lastContactedDate
      }
    });
    
  } catch (error) {
    console.error('Error updating assessment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all assessments
// @route   GET /api/candidates/assessments
// @access  Private
router.get('/assessments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.assessmentStatus = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { candidateName: { $regex: req.query.search, $options: 'i' } },
        { candidateEmail: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const assessments = await CandidateAssessment
      .find(filter)
      .sort({ lastContactedDate: -1 }) // Sort by last contacted date
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await CandidateAssessment.countDocuments(filter);

    res.json({
      success: true,
      data: assessments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessments'
    });
  }
});

// @desc    Get single assessment by ID
// @route   GET /api/candidates/assessment/:id
// @access  Private
router.get('/assessment/:id', async (req, res) => {
  try {
    const assessment = await CandidateAssessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });

  } catch (error) {
    console.error('Error fetching assessment:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessment'
    });
  }
});

// @desc    Download assessment as CSV
// @route   GET /api/candidates/assessment/:id/download
// @access  Public
router.get('/assessment/:id/download', async (req, res) => {
  try {
    const assessment = await CandidateAssessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Create CSV headers
    const headers = [
      'Candidate Name',
      'Email',
      'Phone',
      'Last Contacted',
      'Consultancy',
      'Financial Status',
      'Daily Commute',
      'Aspirations',
      'Money Attitude',
      'Loyalty Behavior',
      'Work Style',
      'Pressure Handling',
      'Role Clarity Need',
      'Fear 1',
      'Motivation 1',
      'Challenge 1',
      'Power Language 1',
      'Company Priority 1',
      'Targets',
      'References',
      'Software Skills',
      'Product Knowledge',
      'Source of Revenue',
      'Assessment Status',
      'Submitted At'
    ];

    // Format date for CSV
    const formatDate = (date) => {
      return date ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '';
    };

    // Create CSV row
    const row = [
      `"${assessment.candidateName || ''}"`,
      `"${assessment.candidateEmail || ''}"`,
      `"${assessment.candidatePhone || ''}"`,
      `"${formatDate(assessment.lastContactedDate || assessment.lastUpdated || assessment.submittedAt)}"`,
      `"${assessment.consultancy || ''}"`,
      `"${assessment.financialStatus || ''}"`,
      `"${assessment.dailyCommute || ''}"`,
      `"${assessment.aspirations || ''}"`,
      `"${assessment.moneyAttitude || ''}"`,
      `"${assessment.loyaltyBehavior || ''}"`,
      `"${assessment.workStyle || ''}"`,
      `"${assessment.pressureHandling || ''}"`,
      `"${assessment.roleClarityNeed || ''}"`,
      `"${assessment.fear1 || ''}"`,
      `"${assessment.motivation1 || ''}"`,
      `"${assessment.challenge1 || ''}"`,
      `"${assessment.powerLanguage1 || ''}"`,
      `"${assessment.companyPriority1 || ''}"`,
      `"${assessment.targets || ''}"`,
      `"${assessment.references || ''}"`,
      `"${assessment.softwares || ''}"`,
      `"${assessment.productKnowledge || ''}"`,
      `"${assessment.sourceOfRevenue || ''}"`,
      `"${assessment.assessmentStatus || ''}"`,
      `"${formatDate(assessment.submittedAt)}"`
    ];

    // Create CSV content
    const csvContent = [headers.join(','), row.join(',')].join('\n');

    // Set response headers for CSV download
    const filename = `${assessment.candidateName || 'candidate'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csvContent);

  } catch (error) {
    console.error('Error downloading assessment:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while downloading assessment'
    });
  }
});

export default router;