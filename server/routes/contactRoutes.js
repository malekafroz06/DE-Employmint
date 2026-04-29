import express from "express";
import ContactInquiry from "../models/ContactInquiry.js";

const router = express.Router();

// POST /api/contact — submit a new inquiry (public)
router.post("/", async (req, res) => {
  try {
    const { fullName, workEmail, phoneNumber, company, additionalInfo } = req.body;

    if (!fullName || !workEmail || !phoneNumber || !company) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    }

    const inquiry = await ContactInquiry.create({
      fullName,
      workEmail,
      phoneNumber,
      company,
      additionalInfo: additionalInfo || "",
    });

    res.status(201).json({ success: true, message: "Inquiry submitted successfully.", inquiry });
  } catch (error) {
    console.error("Contact inquiry error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

export default router;
