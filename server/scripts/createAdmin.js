/**
 * Run this script once to create the first super admin account.
 *
 * Usage:
 *   node server/scripts/createAdmin.js
 *
 * Make sure your .env file is configured with MONGODB_URI before running.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';

const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'admin@jobportal.com';
const ADMIN_PASSWORD = 'Admin@123';

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log('Admin already exists:', ADMIN_EMAIL);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await Admin.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed });

    console.log('✅ Super admin created successfully!');
    console.log('   Email   :', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('\n⚠️  Please change the password after first login.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
