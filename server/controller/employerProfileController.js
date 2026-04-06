import EmployerProfile from '../models/EmployerProfile.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getEmployerProfile = async (req, res) => {
    try {
        const companyId = req.company._id;

        let [company, profile] = await Promise.all([
            Company.findById(companyId).select('-password'),
            EmployerProfile.findOne({ companyId })
        ]);

        // Calculate real-time stats
        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId, visible: true }),
            JobApplication.countDocuments({ companyId }),
            JobApplication.countDocuments({ companyId, status: 'Accepted' })
        ]);

        const realStats = { activeJobs, totalApplications, totalHired };

        if (!profile) {
            profile = await EmployerProfile.create({
                companyId,
                location: '',
                website: '',
                companySize: '',
                description: '',
                logo: company.image || '', // Use company image as default logo
                stats: realStats
            });
        } else {
            // Update existing profile with real-time stats
            profile.stats = realStats;
            await profile.save();
        }

        res.status(200).json({
            success: true,
            data: {
                ...profile.toObject(),
                name: company.name,
                email: company.email,
                phone: company.phone,
                image: company.image,
                logo: profile.logo || company.image || '' // Fallback to company image
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

export const updateEmployerProfile = async (req, res) => {
    try {
        const companyId = req.company._id;
        const {
            name,
            email,
            phone,
            location,
            website,
            companySize,
            description
        } = req.body;

        console.log('=== UPDATE EMPLOYER PROFILE ===');
        console.log('Company ID:', companyId);
        console.log('Has file:', !!req.file);
        console.log('Body data:', { name, email, phone, location, website, companySize });

        // Calculate real-time stats
        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId, visible: true }),
            JobApplication.countDocuments({ companyId }),
            JobApplication.countDocuments({ companyId, status: 'Accepted' })
        ]);

        const realStats = { activeJobs, totalApplications, totalHired };

        let logoPath = null;

        // Handle logo upload if file is present
        if (req.file) {
            try {
                console.log('Processing uploaded logo...');
                console.log('File details:', {
                    filename: req.file.filename,
                    path: req.file.path,
                    destination: req.file.destination,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                });

                // Get the existing profile to delete old logo if exists
                const existingProfile = await EmployerProfile.findOne({ companyId });
                
                if (existingProfile && existingProfile.logo) {
                    // Delete old logo file if it exists
                    const oldLogoPath = path.join(__dirname, '..', existingProfile.logo);
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath);
                        console.log('Old logo deleted:', oldLogoPath);
                    }
                }

                // Multer already saved the file with sanitized filename in uploads/images/
                // Just store the relative path
                logoPath = `/uploads/images/${req.file.filename}`;
                console.log('Logo path to save in DB:', logoPath);

            } catch (uploadError) {
                console.error('Logo upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading logo',
                    error: uploadError.message
                });
            }
        }

        // Prepare profile update data
        const profileUpdateData = {
            location,
            website,
            companySize,
            description,
            stats: realStats
        };

        // Add logo path if it was uploaded
        if (logoPath) {
            profileUpdateData.logo = logoPath;
        }
              
        // Update both company and profile in parallel
        const companyUpdate = { name, email, phone };
        if (logoPath) companyUpdate.image = logoPath; // Sync logo to Company so job cards can display it

        const [company, profile] = await Promise.all([
            Company.findByIdAndUpdate(
                companyId,
                companyUpdate,
                { new: true }
            ).select('-password'),
            
            EmployerProfile.findOneAndUpdate(
                { companyId },
                profileUpdateData,
                { new: true, upsert: true }
            )
        ]);

        console.log('Profile updated successfully');
        console.log('Logo in updated profile:', profile.logo);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                ...profile.toObject(),
                name: company.name,
                email: company.email,
                phone: company.phone,
                image: company.image,
                logo: profile.logo || company.image || ''
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

export const updateProfileStats = async (req, res) => {
    try {
        const companyId = req.company._id;
        
        // Calculate real stats instead of using req.body
        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId, visible: true }),
            JobApplication.countDocuments({ companyId }),
            JobApplication.countDocuments({ companyId, status: 'Accepted' })
        ]);
           
        const profile = await EmployerProfile.findOneAndUpdate(
            { companyId },
            {
                'stats.activeJobs': activeJobs,
                'stats.totalApplications': totalApplications,
                'stats.totalHired': totalHired
            },
            { new: true, upsert: true }
        );
             
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stats updated successfully',
            data: profile.stats
        });
        
    } catch (error) {
        console.error('Update stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating stats',
            error: error.message
        });
    }
};