import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers['admin-token'];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No admin token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not an admin token' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
};

export default adminAuthMiddleware;
