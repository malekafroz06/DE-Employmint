// Jobs are automatically retired from the public portal once they are this old.
export const JOB_MAX_AGE_DAYS = 30;

export const JOB_MAX_AGE_MS = JOB_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

// Timestamp (ms) — jobs whose `date` is older than this are considered expired.
export const jobFreshnessCutoff = () => Date.now() - JOB_MAX_AGE_MS;

// Mongo filter fragment for "still fresh enough to show on the portal".
export const freshJobFilter = () => ({ date: { $gte: jobFreshnessCutoff() } });
