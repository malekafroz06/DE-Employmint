import mongoose from "mongoose";



const jobSchema = new mongoose.Schema({
    title: {type:String,required:true},
    description: {type:String,required:true},
    location: {type:String,required:true},
    product: {
      type: [String],
      default: []
    },
    department: {type:String,required:false,default: ""},
    level:{type:String,required:true},
    noticeperiod:{type:String,required:false,default: "Not specified"},
    salary: {type:Number,required:true},
      jobcategory: {type:String,required:false,default: "Not specified"},
        jobchannel: {type:String,required:false,default: "Not specified"},
    date: {type:Number,required:true},
    visible: {type:Boolean, default: true},
    companyId: {type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true},

});

const Job = mongoose.model('Job', jobSchema)

export default Job; 
