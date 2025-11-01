// cron/dataSync.js
const cron = require('node-cron');
const DataGovFetcher = require('../utils/fetchDataGov');
const CacheHelper = require('../utils/cacheHelper');

class DataSyncJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.schedule = process.env.CRON_SCHEDULE || '0 2 * * *'; // Default: 2 AM daily
  }

  async syncData() {
    if (this.isRunning) {
      console.log('Data sync already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`[${new Date().toISOString()}] Starting data sync...`);

      // Get current date for syncing
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Fetch data for current month
      console.log(`Fetching data for ${year}-${month}...`);
      const results = await DataGovFetcher.bulkFetch(year, month);

      console.log(`✓ Sync completed: ${results.success} successful, ${results.failed} failed`);

      // Clear cache for updated data
      await CacheHelper.delPattern('metric:*');
      await CacheHelper.delPattern('comparison:*');
      console.log('✓ Cache cleared');

      this.lastRun = new Date();

      // Log summary
      const duration = Date.now() - startTime;
      console.log(`Data sync completed in ${duration}ms`);

      if (results.errors.length > 0) {
        console.error('Errors during sync:', results.errors.slice(0, 5)); // Log first 5 errors
      }

      return {
        success: true,
        duration,
        results
      };
    } catch (err) {
      console.error('Data sync error:', err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      this.isRunning = false;
    }
  }

  // Start the cron job
  start() {
    console.log(`Scheduling data sync with pattern: ${this.schedule}`);

    cron.schedule(this.schedule, async () => {
      await this.syncData();
    });

    // Also sync previous month data on startup
    if (process.env.SYNC_ON_STARTUP === 'true') {
      setTimeout(() => {
        this.syncData();
      }, 5000); // Wait 5 seconds after startup
    }
  }

  // Manual trigger (for admin endpoint)
  async trigger() {
    return await this.syncData();
  }

  // Get sync status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      schedule: this.schedule
    };
  }
}

const dataSyncJob = new DataSyncJob();

const startDataSyncJob = () => {
  dataSyncJob.start();
};

const triggerManualSync = async () => {
  return await dataSyncJob.trigger();
};

const getSyncStatus = () => {
  return dataSyncJob.getStatus();
};

module.exports = {
  startDataSyncJob,
  triggerManualSync,
  getSyncStatus
};