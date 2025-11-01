const District = require('../models/District');
const Metric = require('../models/Metric');
const Snapshot = require('../models/Snapshot');
const asyncHandler = require('../middleware/asyncHandler');
const CacheHelper = require('../utils/cacheHelper');
const { triggerManualSync, getSyncStatus } = require('../cron/dataSync');



exports.uploadData = asyncHandler(async (req, res) => {
  const { data, source = 'manual_upload' } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({
      success: false,
      error: 'Data must be an array of records'
    });
  }

  const startTime = Date.now();
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  

  // Create snapshot
  const snapshot = await Snapshot.create({
    source,
    raw_data: data,
    record_count: data.length
  });

  for (const record of data) {
    try {
      // Validate required fields
      if (!record.district_code || !record.year || !record.month) {
        throw new Error('Missing required fields: district_code, year, month');
      }

      // Get or create district
      let district = await District.findOne({ district_code: record.district_code });

      if (!district) {
        if (!record.district_name || !record.state) {
          throw new Error('New district requires district_name and state');
        }

        district = await District.create({
          name: record.district_name,
          state: record.state,
          district_code: record.district_code,
          population: record.population || 0,
          households: record.households || 0
        });
      }

      // Create or update metric
      await Metric.findOneAndUpdate(
        {
          districtId: district._id,
          year: parseInt(record.year),
          month: parseInt(record.month)
        },
        {
          districtId: district._id,
          district_code: record.district_code,
          year: parseInt(record.year),
          month: parseInt(record.month),
          workers: parseInt(record.workers) || 0,
          person_days: parseFloat(record.person_days) || 0,
          wages_paid: parseFloat(record.wages_paid) || 0,
          avg_wage: parseFloat(record.avg_wage) || 0,
          job_cards: parseInt(record.job_cards) || 0,
          days_per_household: parseFloat(record.days_per_household) || 0,
          payment_timely_pct: parseFloat(record.payment_timely_pct) || 0,
          funds_released: parseFloat(record.funds_released) || 0,
          funds_spent: parseFloat(record.funds_spent) || 0,
          complaints: parseInt(record.complaints) || 0,
          source: 'manual',
          data_timestamp: new Date()
        },
        { upsert: true, new: true }
      );

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        record: record.district_code,
        error: err.message
      });
    }
  }

  // Update snapshot
  await Snapshot.findByIdAndUpdate(snapshot._id, {
    success: results.failed === 0,
    error_message: results.errors.length > 0 ? JSON.stringify(results.errors) : null,
    processing_time_ms: Date.now() - startTime
  });

  // Clear cache
  await CacheHelper.delPattern('metric:*');
  await CacheHelper.delPattern('comparison:*');

  res.status(200).json({
    success: true,
    message: 'Data upload completed',
    results,
    processingTime: Date.now() - startTime
  });
});



exports.triggerSync = asyncHandler(async (req, res) => {
  const result = await triggerManualSync();

  res.status(200).json({
    success: result.success,
    data: result
  });
});



exports.getSyncStatus = asyncHandler(async (req, res) => {
  const status = getSyncStatus();

  res.status(200).json({
    success: true,
    data: status
  });
});



exports.clearCache = asyncHandler(async (req, res) => {
  const { pattern } = req.body;

  if (pattern) {
    await CacheHelper.delPattern(pattern);
  } else {
    await CacheHelper.flush();
  }

  res.status(200).json({
    success: true,
    message: 'Cache cleared successfully'
  });
});



exports.getStats = asyncHandler(async (req, res) => {
  const [
    districtCount,
    metricCount,
    snapshotCount,
    latestSnapshot,
    stateCount
  ] = await Promise.all([
    District.countDocuments(),
    Metric.countDocuments(),
    Snapshot.countDocuments(),
    Snapshot.findOne().sort({ fetched_at: -1 }),
    District.distinct('state')
  ]);

  // Get metrics by source
  const metricsBySource = await Metric.aggregate([
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get recent snapshots
  const recentSnapshots = await Snapshot.find()
    .sort({ fetched_at: -1 })
    .limit(10)
    .select('source fetched_at record_count success error_message');

  res.status(200).json({
    success: true,
    data: {
      districts: districtCount,
      states: stateCount.length,
      metrics: metricCount,
      snapshots: snapshotCount,
      metricsBySource,
      latestSnapshot,
      recentSnapshots
    }
  });
});



exports.getSnapshots = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const snapshots = await Snapshot.find()
    .sort({ fetched_at: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .select('-raw_data'); // Exclude raw_data for performance

  const total = await Snapshot.countDocuments();

  res.status(200).json({
    success: true,
    count: snapshots.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: snapshots
  });
});