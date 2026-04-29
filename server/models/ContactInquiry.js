import mongoose from "mongoose";

const contactInquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    workEmail: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    additionalInfo: { type: String, default: "" },
    status: { type: String, enum: ["new", "replied"], default: "new" },
    reply: { type: String, default: "" },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

const ContactInquiry = mongoose.model("ContactInquiry", contactInquirySchema);

export default ContactInquiry;
