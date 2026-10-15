/**
 * Re-parse resumes that were uploaded before auto-parsing existed and fill in
 * their candidate profile (Search Resume → Edit Candidate). Only fields that
 * are still empty are filled — recruiter edits are never overwritten.
 *
 * Usage (from the server folder):
 *   node scripts/reparseResumes.js           # dry run — shows what would change
 *   node scripts/reparseResumes.js --apply   # writes the changes
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import ResumeProcessor from '../utils/resumeProcessor.js';
import { buildProfileFillOps } from '../utils/resumeProfileParser.js';

const apply = process.argv.includes('--apply');
const serverDir = path.join(__dirname, '..');

async function reparseResumes() {
  await mongoose.connect(`${process.env.MONGODB_URI}/job-portal`);
  console.log(`Connected to MongoDB — ${apply ? 'APPLYING changes' : 'dry run (use --apply to write)'}`);

  const resumes = await Resume.find({}).lean();
  let updated = 0, missingFile = 0, noText = 0, unchanged = 0;

  for (const resume of resumes) {
    const filePath = path.isAbsolute(resume.filePath) ? resume.filePath : path.join(serverDir, resume.filePath);
    try {
      await fs.access(filePath);
    } catch {
      missingFile++;
      continue;
    }

    const text = await ResumeProcessor.extractTextFromFile(filePath, resume.fileType);
    if (!text.trim()) {
      noText++;
      continue;
    }

    const { parsedData, candidateProfile } = ResumeProcessor.parseResumeProfile(text);
    const ops = buildProfileFillOps(resume.candidateProfile, candidateProfile);
    // parsedData (name / email / phone) is never recruiter-edited, so refresh blanks only
    Object.entries(parsedData).forEach(([k, v]) => {
      const has = Array.isArray(v) ? v.length : v;
      const existing = resume.parsedData?.[k];
      if (has && !(Array.isArray(existing) ? existing.length : existing)) ops[`parsedData.${k}`] = v;
    });
    if (!resume.extractedText) ops.extractedText = text;

    const fields = Object.keys(ops).filter((k) => k !== 'extractedText');
    if (!fields.length) {
      unchanged++;
      continue;
    }

    console.log(`• ${resume.originalName}: ${fields.map((f) => f.split('.').pop()).join(', ')}`);
    if (apply) await Resume.updateOne({ _id: resume._id }, { $set: ops });
    updated++;
  }

  console.log(`\nResumes: ${resumes.length} | ${apply ? 'updated' : 'would update'}: ${updated} | already complete: ${unchanged} | no readable text (scanned/old .doc): ${noText} | file missing: ${missingFile}`);
  await mongoose.disconnect();
}

reparseResumes().catch(async (err) => {
  console.error('Re-parse failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
