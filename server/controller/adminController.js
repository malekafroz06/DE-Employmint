import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import SubUser from '../models/SubUser.js';
import ContactInquiry from '../models/ContactInquiry.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import SibApiV3Sdk from '@getbrevo/brevo';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAdminProfile = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export const getStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      totalSubUsers,
      recentUsers,
      recentCompanies,
      recentJobs,
      applicationsByStatus,
      jobsByCategory,
    ] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments(),
      JobApplication.countDocuments(),
      SubUser.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Company.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Job.countDocuments({ date: { $gte: thirtyDaysAgo.getTime() } }),
      JobApplication.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $group: { _id: '$jobcategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        totalSubUsers,
        recentUsers,
        recentCompanies,
        recentJobs,
        applicationsByStatus,
        jobsByCategory,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email resume createdAt');

    res.json({
      success: true,
      users,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await JobApplication.deleteMany({ userId: req.params.id });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Companies ───────────────────────────────────────────────────────────────

export const getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email phone image createdAt');

    res.json({
      success: true,
      companies,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    await Job.deleteMany({ companyId: req.params.id });
    await JobApplication.deleteMany({ companyId: req.params.id });
    await SubUser.deleteMany({ parentCompanyId: req.params.id });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search
      ? { title: { $regex: search, $options: 'i' } }
      : {};

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('companyId', 'name image')
      .select('title location level salary visible date companyId jobcategory');

    res.json({
      success: true,
      jobs,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    await JobApplication.deleteMany({ jobId: req.params.id });
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const toggleJobVisibility = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    job.visible = !job.visible;
    await job.save();
    res.json({ success: true, message: `Job ${job.visible ? 'shown' : 'hidden'}`, visible: job.visible });
  } catch (error) {
    console.error('Toggle job visibility error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Applications ─────────────────────────────────────────────────────────────

export const getApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    const query = status ? { status } : {};

    const total = await JobApplication.countDocuments(query);
    const applications = await JobApplication.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('companyId', 'name image')
      .populate('jobId', 'title location level');

    res.json({
      success: true,
      applications,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const app = await JobApplication.findByIdAndDelete(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Contact Inquiries ────────────────────────────────────────────────────────

export const getInquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    const query = status ? { status } : {};

    const total = await ContactInquiry.countDocuments(query);
    const inquiries = await ContactInquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      inquiries,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const replyToInquiry = async (req, res) => {
  try {
    const { replyMessage } = req.body;
    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // Send reply email via Brevo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'Re: Your Inquiry to DE employmint';
    sendSmtpEmail.to = [{ email: inquiry.workEmail, name: inquiry.fullName }];
    sendSmtpEmail.sender = { name: 'DE employmint', email: process.env.SENDER_EMAIL || 'noreply@deemploymint.com' };
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF0000, #CC0000); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DE employmint</h1>
        </div>
        <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px; margin-top: 0;">Dear <strong>${inquiry.fullName}</strong>,</p>
          <p style="color: #374151; font-size: 15px;">Thank you for reaching out to us. Here is our response to your inquiry:</p>
          <div style="background: white; border-left: 4px solid #FF0000; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #1f2937; font-size: 15px; margin: 0; white-space: pre-line;">${replyMessage}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            If you have any further questions, feel free to reach out to us.<br/>
            <strong>DE employmint Team</strong>
          </p>
        </div>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    // Update inquiry status
    inquiry.reply = replyMessage;
    inquiry.status = 'replied';
    inquiry.repliedAt = new Date();
    await inquiry.save();

    res.json({ success: true, message: 'Reply sent successfully', inquiry });
  } catch (error) {
    console.error('Reply inquiry error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
