// cronJobs.js - SIMPLIFIED: Single Daily Digest at 9 AM
import cron from 'node-cron';
import { sendDailyDigestAt9AM, getPendingJobStats } from './services/jobNotificationService.js';
import Job from './models/Job.js';
import { jobFreshnessCutoff, JOB_MAX_AGE_DAYS } from './utils/jobExpiry.js';

// Retire postings older than the max age (30 days) so they drop off the portal
// and out of all "visible" counts, even if the recruiter never logs back in.
export const expireOldJobs = async () => {
  const result = await Job.updateMany(
    { visible: true, date: { $lt: jobFreshnessCutoff() } },
    { $set: { visible: false } }
  );
  return result.modifiedCount || 0;
};

export const startJobExpiry = () => {
  // Every day at 00:30 IST
  cron.schedule('30 0 * * *', async () => {
    try {
      const expired = await expireOldJobs();
      console.log(`🗓️  Job expiry sweep: hid ${expired} posting(s) older than ${JOB_MAX_AGE_DAYS} days`);
    } catch (error) {
      console.error('❌ Job expiry sweep failed:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log(`✅ Job expiry sweep scheduled (daily 00:30 IST, ${JOB_MAX_AGE_DAYS}-day limit)`);
};

// Main digest job - Runs EVERY day at 9:00 AM
export const startDailyDigest = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('\n⏰ Running daily digest at 9:00 AM:', new Date().toISOString());
    console.log('━'.repeat(60));
    
    try {
      const result = await sendDailyDigestAt9AM();
      
      console.log('━'.repeat(60));
      console.log('✅ Daily digest completed successfully');
      console.log(`📊 Results:`, result);
      console.log('━'.repeat(60) + '\n');
      
    } catch (error) {
      console.error('━'.repeat(60));
      console.error('❌ Daily digest failed:', error);
      console.error('━'.repeat(60) + '\n');
    }
  }, {
    timezone: "Asia/Kolkata"
  });
  
  console.log('✅ Daily digest cron job scheduled (9:00 AM IST every day)');
};

// Stats monitoring - Runs every 6 hours
export const startStatsMonitoring = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      const stats = await getPendingJobStats();
      console.log('\n📊 Pending Jobs Stats:', new Date().toISOString());
      console.table(stats);
    } catch (error) {
      console.error('❌ Stats monitoring failed:', error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
  
  console.log('✅ Stats monitoring scheduled (every 6 hours)');
};

// Initialize all cron jobs
export const initializeCronJobs = () => {
  console.log('\n🚀 Initializing cron jobs...');
  console.log('═'.repeat(60));
  
  startDailyDigest();
  startStatsMonitoring();
  startJobExpiry();

  // Run one expiry sweep at boot so a long downtime doesn't leave stale jobs up.
  expireOldJobs()
    .then(n => n && console.log(`🗓️  Startup job expiry sweep: hid ${n} stale posting(s)`))
    .catch(err => console.error('❌ Startup job expiry sweep failed:', err));

  console.log('═'.repeat(60));
  console.log('✅ All cron jobs initialized successfully');
  console.log('📅 Next digest will run at 9:00 AM IST\n');
};

// Test function
export const testDigestNow = async () => {
  console.log('\n🧪 TESTING: Running digest now...');
  console.log('═'.repeat(60));
  
  try {
    const result = await sendDailyDigestAt9AM();
    
    console.log('═'.repeat(60));
    console.log('✅ Test completed successfully');
    console.log('📊 Results:', result);
    console.log('═'.repeat(60) + '\n');
    
    return result;
  } catch (error) {
    console.error('═'.repeat(60));
    console.error('❌ Test failed:', error);
    console.error('═'.repeat(60) + '\n');
    throw error;
  }
};
