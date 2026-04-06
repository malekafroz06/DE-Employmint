import Job from "../models/Job.js";
import EmployerProfile from "../models/EmployerProfile.js";

// Helper: merge EmployerProfile logos into jobs
const mergeLogos = async (jobs) => {
    const companyIds = [...new Set(jobs.map(j => j.companyId?._id?.toString()).filter(Boolean))];
    const profiles = await EmployerProfile.find({ companyId: { $in: companyIds } }).select('companyId logo');
    const logoMap = {};
    profiles.forEach(p => { logoMap[p.companyId.toString()] = p.logo; });

    return jobs.map(job => {
        const obj = job.toObject ? job.toObject() : { ...job };
        if (obj.companyId) {
            const profileLogo = logoMap[obj.companyId._id?.toString()];
            obj.companyId.image = profileLogo || obj.companyId.image || '';
        }
        return obj;
    });
};

// Get all jobs
export const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ visible: true})
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
        
        // Find and delete the job
        const job = await Job.findByIdAndDelete(id);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

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