const District = require('../models/District');
const MGNREGAData = require('../models/MGNREGAData');
const govApiService = require('../services/govApiService');
const cacheService = require('../services/cacheService');
const { cache, cacheKeys, cacheTTL } = require('../config/cache');
const logger = require('../utils/logger');

/**
 * GET /api/v1/states/:stateCode/districts
 * Get all districts for a state
 */
exports.getDistricts = async (req, res, next) => {
  try {
    const { stateCode } = req.params;
    const cacheKey = cacheKeys.stateDistricts(stateCode);

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      req.fromCache = true;
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cached
      });
    }

    // Check database
    let districts = await District.find({ state_code: stateCode })
      .select('-__v -createdAt -updatedAt')
      .lean();

    // If not in DB or empty, fetch from API
    if (!districts || districts.length === 0) {
      // Get state name from State collection
      const state = await State.findOne({ state_code: stateCode }).lean();
      
      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'State not found. Please fetch states first using POST /api/v1/states'
        });
      }

      const result = await govApiService.fetchDistricts(stateCode, state.state_name);

      if (!result.success) {
        return res.status(503).json({
          success: false,
          error: 'Failed to fetch districts',
          message: result.error
        });
      }

      // Store in database
      const bulkOps = result.data.map(district => ({
        updateOne: {
          filter: { district_code: district.district_code },
          update: {
            $set: {
              district_name: district.district_name,
              state_code: stateCode,
              state_name: state.state_name,
              last_updated: new Date()
            }
          },
          upsert: true
        }
      }));

      if (bulkOps.length > 0) {
        await District.bulkWrite(bulkOps);
      }
      
      districts = result.data;
      logger.info(`Fetched ${districts.length} districts for ${stateCode} from API`);
    }

    // Cache for 24 hours
    cache.set(cacheKey, districts, cacheTTL.DISTRICTS);

    res.status(200).json({
      success: true,
      source: 'database',
      count: districts.length,
      data: districts
    });

  } catch (error) {
    logger.error('Error in getDistricts:', error);
    next(error);
  }
};

/**
 * GET /api/v1/district/:districtCode/data
 * Get MGNREGA data for a district for specific month/year
 */
exports.getDistrictData = async (req, res, next) => {
  try {
    const { districtCode } = req.params;
    const { month, year } = req.query;
    const dataParser = require('../utils/dataParser');

    const cacheKey = cacheKeys.districtData(districtCode, month, year);

    console.log("Cache Key:", cacheKey, {districtCode, month, year});
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      req.fromCache = true;
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cached
      });
    }


    // Check database
    let dbData = await MGNREGAData.findOne({
      district_code: districtCode,
    }).lean();

    console.log("DB Data:", dbData);

    // Check if data is stale
    const shouldRefresh = !dbData || 
      (Date.now() - new Date(dbData.updated_at)) > 
      (parseInt(process.env.DATA_REFRESH_DAYS || 20) * 24 * 60 * 60 * 1000);

    if (shouldRefresh) {
      // Get district info for state name
      const district = await District.findOne({ district_code: districtCode }).lean();
      
      // Fetch fresh data from API
      const result = await govApiService.fetchDistrictData(
        districtCode, 
        month, 
        year,
        district?.state_name
      );

      if (result.success && result.data) {
        // Parse and normalize API data
        const parsedData = dataParser.parseDistrictData(result.data);
        
        // Update or create in database
        dbData = await MGNREGAData.findOneAndUpdate(
          { district_code: districtCode, fin_year: year, month: month },
          { $set: parsedData },
          { upsert: true, new: true }
        ).lean();

        logger.info(`Refreshed data for ${districtCode} from API`);
      } else if (!dbData) {
        // API failed and no cached data
        return res.status(503).json({
          success: false,
          error: 'Failed to fetch data',
          message: 'Government API unavailable and no cached data found'
        });
      }
    }

    // Format data for frontend
    const formattedData = dataParser.formatForFrontend(dbData);

    // Determine TTL based on data age
    const isCurrentMonth = year.endsWith(new Date().getFullYear().toString()) && 
                           month === new Date().toLocaleString('en-US', { month: 'short' });
    const ttl = isCurrentMonth ? cacheTTL.HOT_DATA : cacheTTL.HISTORICAL;

    // Cache the formatted data
    cache.set(cacheKey, formattedData, ttl);

    res.status(200).json({
      success: true,
      source: shouldRefresh ? 'api' : 'database',
      data: formattedData,
      cached: false,
      lastUpdated: dbData.updated_at
    });

  } catch (error) {
    logger.error('Error in getDistrictData:', error);
    next(error);
  }
};

/**
 * GET /api/v1/district/:districtCode/history
 * Get historical data for a district
 */
exports.getDistrictHistory = async (req, res, next) => {
  try {
    const { districtCode } = req.params;
    const { startDate, endDate } = req.query;

    const cacheKey = cacheKeys.districtHistory(districtCode, startDate, endDate);

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      req.fromCache = true;
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cached
      });
    }

    // Parse date range
    const [startYear, startMonth] = startDate.split('-');
    const [endYear, endMonth] = endDate.split('-');

    // Query database
    const history = await MGNREGAData.find({
      district_code: districtCode,
      $or: [
        {
          fin_year: { $gte: `${startYear}-${parseInt(startYear) + 1}` },
          fin_year: { $lte: `${endYear}-${parseInt(endYear) + 1}` }
        }
      ]
    })
    .select('-__v')
    .sort({ fin_year: 1, month: 1 })
    .lean();

    // Calculate trends
    const trends = calculateTrends(history);

    const response = {
      district_code: districtCode,
      period: { start: startDate, end: endDate },
      dataPoints: history.length,
      data: history,
      trends
    };

    // Cache for 1 hour
    cache.set(cacheKey, response, cacheTTL.HISTORICAL);

    res.status(200).json({
      success: true,
      source: 'database',
      ...response
    });

  } catch (error) {
    logger.error('Error in getDistrictHistory:', error);
    next(error);
  }
};

/**
 * GET /api/v1/district/:districtCode/comparison
 * Compare district with state average
 */
exports.getDistrictComparison = async (req, res, next) => {
  try {
    const { districtCode } = req.params;

    const cacheKey = cacheKeys.districtComparison(districtCode);

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      req.fromCache = true;
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cached
      });
    }

    // Get district info
    const district = await District.findOne({ district_code: districtCode }).lean();
    
    if (!district) {
      return res.status(404).json({
        success: false,
        error: 'District not found'
      });
    }

    // Get last 6 months data for district
    const districtData = await MGNREGAData.find({ district_code: districtCode })
      .sort({ updated_at: -1 })
      .limit(6)
      .lean();

    // Get state average (aggregate all districts in state)
    const dataParser = require('../utils/dataParser');
    const stateAverage = await MGNREGAData.aggregate([
      { $match: { state_code: district.state_code } },
      { $sort: { updated_at: -1 } },
      { $limit: 100 },
      {
        $group: {
          _id: null,
          avgHouseholds: { 
            $avg: { 
              $convert: { 
                input: '$Total_Households_Worked', 
                to: 'double',
                onError: 0,
                onNull: 0
              } 
            } 
          },
          avgExpenditure: { 
            $avg: { 
              $convert: { 
                input: '$Total_Exp', 
                to: 'double',
                onError: 0,
                onNull: 0
              } 
            } 
          }
        }
      }
    ]);

    const comparison = {
      district: {
        code: districtCode,
        name: district.district_name,
        recentData: districtData
      },
      stateAverage: stateAverage[0] || {},
      performance: calculatePerformance(districtData, stateAverage[0])
    };

    // Cache for 30 minutes
    cache.set(cacheKey, comparison, cacheTTL.COMPARISON);

    res.status(200).json({
      success: true,
      source: 'database',
      data: comparison
    });

  } catch (error) {
    logger.error('Error in getDistrictComparison:', error);
    next(error);
  }
};

// Helper function to calculate trends
function calculateTrends(data) {
  if (data.length < 2) return {};

  const dataParser = require('../utils/dataParser');
  const recent = data.slice(-6);
  const older = data.slice(-12, -6);

  if (older.length === 0) return {};

  const recentAvg = recent.reduce((sum, d) => 
    sum + dataParser.toNumber(d.Total_Households_Worked), 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => 
    sum + dataParser.toNumber(d.Total_Households_Worked), 0) / older.length;

  const change = olderAvg === 0 ? 0 : ((recentAvg - olderAvg) / olderAvg) * 100;

  return {
    recentAverage: parseFloat(recentAvg.toFixed(2)),
    olderAverage: parseFloat(olderAvg.toFixed(2)),
    percentageChange: parseFloat(change.toFixed(2)),
    trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable'
  };
}

// Helper function to calculate performance
function calculatePerformance(districtData, stateAvg) {
  if (!districtData.length || !stateAvg) return {};

  const dataParser = require('../utils/dataParser');
  const districtAvg = districtData.reduce((sum, d) => 
    sum + dataParser.toNumber(d.Total_Households_Worked), 0) / districtData.length;

  const performance = stateAvg.avgHouseholds === 0 ? 0 : 
    ((districtAvg - stateAvg.avgHouseholds) / stateAvg.avgHouseholds) * 100;

  return {
    districtAverage: parseFloat(districtAvg.toFixed(2)),
    stateAverage: parseFloat(stateAvg.avgHouseholds.toFixed(2)),
    performanceIndex: parseFloat(performance.toFixed(2)),
    status: performance > 10 ? 'Above Average' : 
            performance < -10 ? 'Below Average' : 'Average'
  };
}

module.exports = exports;