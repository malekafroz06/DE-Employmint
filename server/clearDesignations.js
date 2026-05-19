import mongoose from 'mongoose';

await mongoose.connect('mongodb+srv://afrozmalek2003_db_user:Afroz%402404@cluster0.u03k2hw.mongodb.net/jobPortal?retryWrites=true&w=majority&appName=Cluster0');

const db = mongoose.connection.db;

// Clear designations
await db.collection('jobs').updateMany(
  {},
  { $unset: { designation: "" } }
);
console.log("✅ All designations cleared!");

// Delete all jobs
await db.collection('jobs').deleteMany({});
console.log("✅ All jobs deleted!");

process.exit(0);