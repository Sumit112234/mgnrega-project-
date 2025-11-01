// controllers/metricController.js
const District = require('../models/District');
const Metric = require('../models/Metric');
const asyncHandler = require('../middleware/asyncHandler');
const CacheHelper = require('../utils/cacheHelper');
const DataGovFetcher = require('../utils/fetchDataGov');

// @desc    Get metrics for a district (DB-first with API fallback)
// @route   GET /api/v1/metrics/districts/:districtId
// @access  Public
exports.getDistrictMetrics = asyncHandler(async (req, res) => {
  const { districtId } = req.params;
  const { month, year } = req.query;

  // Validate inputs
  if (!month || !year) {
    return res.status(400).json({
      success: false,
      error: 'Month and year are required'
    });
  }

  const monthNum = parseInt(month);
  const yearNum = parseInt(year);

  if (monthNum < 1 || monthNum > 12 || yearNum < 2000 || yearNum > 2100) {
    return res.status(400).json({
      success: false,
      error: 'Invalid month or year'
    });
  }

  // Check cache first
  const cacheKey = CacheHelper.getMetricKey(districtId, yearNum, monthNum);
  let metrics = await CacheHelper.get(cacheKey);

  if (metrics) {
    return res.status(200).json({
      success: true,
      data: metrics,
      source: 'cache'
    });
  }

  // Check database
  const district = await District.findById(districtId);
  if (!district) {
    return res.status(404).json({
      success: false,
      error: 'District not found'
    });
  }

  metrics = await Metric.findOne({
    districtId,
    year: yearNum,
    month: monthNum
  }).populate('districtId', 'name state district_code');

  // If found in DB, cache and return
  if (metrics) {
    await CacheHelper.set(cacheKey, metrics, 3600);
    return res.status(200).json({
      success: true,
      data: metrics,
      source: 'database',
      lastUpdated: metrics.data_timestamp
    });
  }

  // Not in DB - fetch from API
  
  try {
    console.log(`Fetching from API: ${district.district_code}, ${yearNum}-${monthNum}`);
    metrics = await DataGovFetcher.fetchAndSave(
      district.district_code,
      yearNum,
      monthNum
    );

    if (!metrics) {
      // API returned no data - check for last available data
      const lastMetric = await Metric.findOne({ districtId })
        .sort({ year: -1, month: -1 })
        .populate('districtId', 'name state district_code');

      if (lastMetric) {
        return res.status(200).json({
          success: true,
          data: lastMetric,
          source: 'database_fallback',
          message: 'Requested data not available. Showing last available data.',
          lastUpdated: lastMetric.data_timestamp
        });
      }

      return res.status(404).json({
        success: false,
        error: 'No data available for this district and period'
      });
    }

    // Populate district info
    await metrics.populate('districtId', 'name state district_code');

    // Cache the result
    await CacheHelper.set(cacheKey, metrics, 3600);

    res.status(200).json({
      success: true,
      data: metrics,
      source: 'api',
      lastUpdated: metrics.data_timestamp
    });
  } catch (err) {
    // API failed - try to serve last available data
    const lastMetric = await Metric.findOne({ districtId })
      .sort({ year: -1, month: -1 })
      .populate('districtId', 'name state district_code');

    if (lastMetric) {
      return res.status(200).json({
        success: true,
        data: lastMetric,
        source: 'database_fallback',
        message: 'API unavailable. Showing last available data.',
        lastUpdated: lastMetric.data_timestamp,
        apiError: err.message
      });
    }

    return res.status(503).json({
      success: false,
      error: 'Data not available and API is unreachable',
      details: err.message
    });
  }
});

// @desc    Get historical metrics (trend analysis)
// @route   GET /api/v1/metrics/districts/:districtId/history
// @access  Public
exports.getDistrictHistory = asyncHandler(async (req, res) => {
  const { districtId } = req.params;
  const { startYear, startMonth, endYear, endMonth, limit } = req.query;

  const query = { districtId };

  if (startYear && startMonth) {
    query.$or = [
      { year: { $gt: parseInt(startYear) } },
      { year: parseInt(startYear), month: { $gte: parseInt(startMonth) } }
    ];
  }

  if (endYear && endMonth) {
    if (!query.$and) query.$and = [];
    query.$and.push({
      $or: [
        { year: { $lt: parseInt(endYear) } },
        { year: parseInt(endYear), month: { $lte: parseInt(endMonth) } }
      ]
    });
  }

  const metrics = await Metric.find(query)
    .sort({ year: -1, month: -1 })
    .limit(parseInt(limit) || 12)
    .populate('districtId', 'name state district_code');

  res.status(200).json({
    success: true,
    count: metrics.length,
    data: metrics
  });
});

// @desc    Compare district with state average
// @route   GET /api/v1/metrics/districts/:districtId/compare
// @access  Public
exports.compareWithState = asyncHandler(async (req, res) => {
  const { districtId } = req.params;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      error: 'Month and year are required'
    });
  }

  const monthNum = parseInt(month);
  const yearNum = parseInt(year);

  // Check cache
  const cacheKey = CacheHelper.getComparisonKey(districtId, yearNum, monthNum);
  let comparison = await CacheHelper.get(cacheKey);

  if (comparison) {
    return res.status(200).json({
      success: true,
      data: comparison,
      source: 'cache'
    });
  }

  // Get district info and metrics
  const district = await District.findById(districtId);
  if (!district) {
    return res.status(404).json({
      success: false,
      error: 'District not found'
    });
  }

  const districtMetric = await Metric.findOne({
    districtId,
    year: yearNum,
    month: monthNum
  });

  if (!districtMetric) {
    return res.status(404).json({
      success: false,
      error: 'No metrics found for this district and period'
    });
  }

  // Get all districts in the same state
  const stateDistricts = await District.find({ state: district.state }).select('_id');
  const districtIds = stateDistricts.map(d => d._id);

  // Calculate state averages
  const stateAvg = await Metric.aggregate([
    {
      $match: {
        districtId: { $in: districtIds },
        year: yearNum,
        month: monthNum
      }
    },
    {
      $group: {
        _id: null,
        avg_workers: { $avg: '$workers' },
        avg_person_days: { $avg: '$person_days' },
        avg_wages_paid: { $avg: '$wages_paid' },
        avg_wage: { $avg: '$avg_wage' },
        avg_days_per_household: { $avg: '$days_per_household' },
        avg_payment_timely_pct: { $avg: '$payment_timely_pct' },
        total_districts: { $sum: 1 }
      }
    }
  ]);

  if (stateAvg.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Insufficient state data for comparison'
    });
  }

  comparison = {
    district: {
      name: district.name,
      state: district.state,
      metrics: districtMetric
    },
    stateAverage: stateAvg[0],
    comparison: {
      workers: {
        district: districtMetric.workers,
        stateAvg: stateAvg[0].avg_workers,
        percentDiff: ((districtMetric.workers - stateAvg[0].avg_workers) / stateAvg[0].avg_workers * 100).toFixed(2)
      },
      personDays: {
        district: districtMetric.person_days,
        stateAvg: stateAvg[0].avg_person_days,
        percentDiff: ((districtMetric.person_days - stateAvg[0].avg_person_days) / stateAvg[0].avg_person_days * 100).toFixed(2)
      },
      avgWage: {
        district: districtMetric.avg_wage,
        stateAvg: stateAvg[0].avg_wage,
        percentDiff: ((districtMetric.avg_wage - stateAvg[0].avg_wage) / stateAvg[0].avg_wage * 100).toFixed(2)
      },
      daysPerHousehold: {
        district: districtMetric.days_per_household,
        stateAvg: stateAvg[0].avg_days_per_household,
        percentDiff: ((districtMetric.days_per_household - stateAvg[0].avg_days_per_household) / stateAvg[0].avg_days_per_household * 100).toFixed(2)
      },
      timelyPayment: {
        district: districtMetric.payment_timely_pct,
        stateAvg: stateAvg[0].avg_payment_timely_pct,
        percentDiff: ((districtMetric.payment_timely_pct - stateAvg[0].avg_payment_timely_pct) / stateAvg[0].avg_payment_timely_pct * 100).toFixed(2)
      }
    }
  };

  // Cache for 1 hour
  await CacheHelper.set(cacheKey, comparison, 3600);

  res.status(200).json({
    success: true,
    data: comparison
  });
});