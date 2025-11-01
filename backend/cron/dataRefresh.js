// src/cron/dataRefresh.js
const cron = require('node-cron');
const MGNREGAData = require('../models/MGNREGAData');
const District = require('../models/District');
const govApiService = require('../services/govApiService');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Daily refresh job - Runs at midnight
 * Refreshes data for districts accessed in last 30 days
 */
const dailyRefreshJob = cron.schedule('0 0 * * *', async () => {
  logger.info('Starting daily data refresh job');
  
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Find districts with recent activity
    const activeDistricts = await MGNREGAData.aggregate([
      {
        $match: {
          updated_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$district_code',
          lastUpdate: { $max: '$updated_at' }
        }
      },
      {
        $sort: { lastUpdate: -1 }
      },
      {
        $limit: 100
      }
    ]);

    logger.info(`Found ${activeDistricts.length} active districts to refresh`);

    // Get current month and year
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = `${now.getFullYear()}-${now.getFullYear() + 1}`;

    // Refresh data for each district
    let successCount = 0;
    let failCount = 0;

    for (const district of activeDistricts) {
      try {
        const result = await govApiService.fetchDistrictData(
          district._id,
          month,
          year
        );

        if (result.success) {
          const dataParser = require('../utils/dataParser');
          const parsedData = dataParser.parseDistrictData(result.data);
          
          await MGNREGAData.findOneAndUpdate(
            {
              district_code: district._id,
              fin_year: year,
              month: month
            },
            { $set: parsedData },
            { upsert: true }
          );

          // Invalidate cache for this district
          cacheService.invalidateDistrict(district._id);
          successCount++;
        } else {
          failCount++;
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`Failed to refresh ${district._id}:`, error.message);
        failCount++;
      }
    }

    logger.info(`Daily refresh completed. Success: ${successCount}, Failed: ${failCount}`);

  } catch (error) {
    logger.error('Daily refresh job failed:', error);
  }
}, {
  scheduled: false
});

/**
 * Weekly full refresh - Runs every Sunday at 2 AM
 * Refreshes data for top 100 most popular districts
 */
const weeklyRefreshJob = cron.schedule('0 2 * * 0', async () => {
  logger.info('Starting weekly full refresh job');
  
  try {
    // Get top 100 most queried districts
    const popularDistricts = await MGNREGAData.aggregate([
      {
        $group: {
          _id: '$district_code',
          district_name: { $first: '$district_name' },
          queryCount: { $sum: 1 },
          lastUpdate: { $max: '$updated_at' }
        }
      },
      {
        $sort: { queryCount: -1 }
      },
      {
        $limit: 100
      }
    ]);

    logger.info(`Refreshing ${popularDistricts.length} popular districts`);

    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = `${now.getFullYear()}-${now.getFullYear() + 1}`;

    // Prepare cache warming data
    const warmingData = popularDistricts.map(d => ({
      code: d._id,
      month,
      year
    }));

    // Warm cache for popular districts
    await cacheService.warmCache(warmingData, async (code, month, year) => {
      const result = await govApiService.fetchDistrictData(code, month, year);
      
      if (result.success) {
        const dataParser = require('../utils/dataParser');
        const parsedData = dataParser.parseDistrictData(result.data);
        
        await MGNREGAData.findOneAndUpdate(
          { district_code: code, fin_year: year, month: month },
          { $set: parsedData },
          { upsert: true }
        );
        
        return parsedData;
      }

      return null;
    });

    logger.info('Weekly refresh completed');

  } catch (error) {
    logger.error('Weekly refresh job failed:', error);
  }
}, {
  scheduled: false
});

/**
 * Monthly cleanup - Runs on 1st of every month at 3 AM
 * Removes data older than 3 years
 */
const monthlyCleanupJob = cron.schedule('0 3 1 * *', async () => {
  logger.info('Starting monthly cleanup job');
  
  try {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const result = await MGNREGAData.deleteMany({
      created_at: { $lt: threeYearsAgo }
    });

    logger.info(`Cleanup completed. Deleted ${result.deletedCount} old records`);

    // Clear cache after cleanup
    cacheService.clearAll();
    logger.info('Cache cleared after cleanup');

  } catch (error) {
    logger.error('Monthly cleanup job failed:', error);
  }
}, {
  scheduled: false
});

/**
 * Cache refresh job - Runs every 10 minutes
 * Refreshes cache for hot data
 */
const cacheRefreshJob = cron.schedule('*/10 * * * *', async () => {
  try {
    // Get cache statistics
    const stats = cacheService.getStats();
    
    logger.debug(`Cache stats - Keys: ${stats.keys}, Hit rate: ${stats.hitRate}%`);

    // If cache hit rate is low, warm cache for popular districts
    if (parseFloat(stats.hitRate) < 50 && stats.keys < 50) {
      logger.info('Cache hit rate low, warming cache...');
      
      const popularDistricts = await MGNREGAData.aggregate([
        {
          $match: {
            updated_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$district_code',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]);

      const now = new Date();
      const month = now.toLocaleString('en-US', { month: 'short' });
      const year = `${now.getFullYear()}-${now.getFullYear() + 1}`;

      const warmingData = popularDistricts.map(d => ({
        code: d._id,
        month,
        year
      }));

      await cacheService.warmCache(warmingData, async (code, month, year) => {
        return await MGNREGAData.findOne({
          district_code: code,
          fin_year: year,
          month: month
        }).lean();
      });
    }

  } catch (error) {
    logger.error('Cache refresh job failed:', error);
  }
}, {
  scheduled: false
});

/**
 * Start all cron jobs
 */
function startCronJobs() {
  dailyRefreshJob.start();
  weeklyRefreshJob.start();
  monthlyCleanupJob.start();
  cacheRefreshJob.start();
  
  logger.info('All cron jobs started successfully');
}

/**
 * Stop all cron jobs
 */
function stopCronJobs() {
  dailyRefreshJob.stop();
  weeklyRefreshJob.stop();
  monthlyCleanupJob.stop();
  cacheRefreshJob.stop();
  
  logger.info('All cron jobs stopped');
}

module.exports = {
  startCronJobs,
  stopCronJobs,
  dailyRefreshJob,
  weeklyRefreshJob,
  monthlyCleanupJob,
  cacheRefreshJob
};