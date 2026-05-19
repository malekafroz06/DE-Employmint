import mongoose from 'mongoose';

await mongoose.connect('mongodb+srv://afrozmalek2003_db_user:Afroz%402404@cluster0.u03k2hw.mongodb.net/jobPortal?retryWrites=true&w=majority&appName=Cluster0');

const db = mongoose.connection.db;

await db.collection('jobs').updateMany(
  { jobcategory: "Equity Broking" },
  { $set: { jobcategory: "Stock Market" } }
);
await db.collection('jobs').updateMany(
  { jobcategory: "Commodity Broking" },
  { $set: { jobcategory: "Stock Market" } }
);
await db.collection('jobs').updateMany(
  { jobcategory: "Technical Research" },
  { $set: { jobcategory: "Technical Analysis" } }
);
await db.collection('jobs').updateMany(
  { jobcategory: "Microfiance" },
  { $set: { jobcategory: "Microfinance Institution (MFI)" } }
);

console.log("✅ All job categories fixed!");
process.exit(0);