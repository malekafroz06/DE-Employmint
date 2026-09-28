import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import EmployerProfile from "../models/EmployerProfile.js";
import { freshJobFilter, jobFreshnessCutoff } from "../utils/jobExpiry.js";

// Helper: merge EmployerProfile logo/location into jobs
const mergeLogos = async (jobs) => {
    const companyIds = [...new Set(jobs.map(j => j.companyId?._id?.toString()).filter(Boolean))];
    const profiles = await EmployerProfile.find({ companyId: { $in: companyIds } }).select('companyId logo location');
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.companyId.toString()] = p; });

    return jobs.map(job => {
        const obj = job.toObject ? job.toObject() : { ...job };
        if (obj.companyId) {
            const profile = profileMap[obj.companyId._id?.toString()];
            obj.companyId.image = profile?.logo || obj.companyId.image || '';
            obj.companyId.location = profile?.location || '';
        }
        return obj;
    });
};

// Get all jobs
export const getJobs = async (req, res) => {
    try {
        // Hide jobs older than the max age (30 days) from the public portal,
        // regardless of whether their `visible` flag has been swept yet.
        const jobs = await Job.find({ visible: true, ...freshJobFilter() })
            .populate({path: "companyId", select: "-password"})

        const jobsWithLogos = await mergeLogos(jobs);
        res.json({success: true, data: jobsWithLogos})
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
};

// Get a single job by ID
export const getJobById = async (req, res) => {
    try {
        const {id} = req.params
        const job = await Job.findById(id)
        .populate({
            path:"companyId",
            select:"-password",
        })

        if(!job){
            return res.status(404).json({
                success:false,
                message:"Job not found"
            })
        }

        // A job that has been hidden or is older than the max age (30 days)
        // is no longer available on the portal.
        if (!job.visible || job.date < jobFreshnessCutoff()) {
            return res.status(404).json({
                success: false,
                message: "This job posting is no longer available"
            })
        }

        const [jobWithLogo] = await mergeLogos([job]);
        res.json({
            success:true,
            data: jobWithLogo
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

// Delete a job by ID
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Preserve the job title in all linked applications before deleting
        await JobApplication.updateMany({ jobId: id }, { $set: { jobTitle: job.title } });

        await job.deleteOne();

        res.json({
            success: true,
            message: "Job deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}