
const cron = require('node-cron');
const DataGovFetcher = require('../utils/fetchDataGov');
const CacheHelper = require('../utils/cacheHelper');

class DataSyncJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.schedule = process.env.CRON_SCHEDULE || '0 2 * * *'; 
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

      
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      
      console.log(`Fetching data for ${year}-${month}...`);
      const results = await DataGovFetcher.bulkFetch(year, month);

      console.log(`✓ Sync completed: ${results.success} successful, ${results.failed} failed`);

      
      await CacheHelper.delPattern('metric:*');
      await CacheHelper.delPattern('comparison:*');
      console.log('✓ Cache cleared');

      this.lastRun = new Date();

      
      const duration = Date.now() - startTime;
      console.log(`Data sync completed in ${duration}ms`);

      if (results.errors.length > 0) {
        console.error('Errors during sync:', results.errors.slice(0, 5)); 
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

  
  start() {
    console.log(`Scheduling data sync with pattern: ${this.schedule}`);

    cron.schedule(this.schedule, async () => {
      await this.syncData();
    });

    
    if (process.env.SYNC_ON_STARTUP === 'true') {
      setTimeout(() => {
        this.syncData();
      }, 5000); 
    }
  }

  
  async trigger() {
    return await this.syncData();
  }

  
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