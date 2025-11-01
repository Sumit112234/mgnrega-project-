const State = require('../models/State');
const govApiService = require('../services/govApiService');
const { cache, cacheKeys, cacheTTL } = require('../config/cache');
const logger = require('../utils/logger');


exports.fetchStates = async (req, res, next) => {
  try {
    // Fetch from government API
    // logger.info("Fetching states from DB");
    const result = await State.find({});
    // console.log("Fetched states from DB:", result);
    // const result = await govApiService.fetchStates();

    if (result.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'Failed to fetch states from government API',
        message: result.error
      });
    }

    // Store in database
    // const states = result.data;
    // const bulkOps = states.map(state => ({
    //   updateOne: {
    //     filter: { state_code: state.state_code },
    //     update: {
    //       $set: {
    //         state_name: state.state_name,
    //         last_updated: new Date()
    //       }
    //     },
    //     upsert: true
    //   }
    // }));

    // if (bulkOps.length > 0) {
    //   await State.bulkWrite(bulkOps);
    //   logger.info(`Updated ${states.length} states in database`);
    // }

    res.status(200).json({
      success: true,
      count: result?.length,
      data: result,
      message: 'States updated successfully'
    });

  } catch (error) {
    logger.error('Error in fetchStates:', error);
    next(error);
  }
};


exports.syncStateData = async (req, res, next) => {
  try {
    const { stateCode } = req.params;
    const { finYear } = req.query;

    // Get state name
    const state = await State.findOne({ state_code: stateCode }).lean();
    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'State not found. Please fetch states first.'
      });
    }

    // Fetch data from API
    const result = await govApiService.fetchByStateAndYear(state.state_name, finYear);

    if (!result.success || !result.data || result.data.length === 0) {
      return res.status(503).json({
        success: false,
        error: 'Failed to fetch data from government API',
        message: result.error
      });
    }

    const dataParser = require('../utils/dataParser');
    const records = result.data;
    let inserted = 0;
    let updated = 0;

    // Process each record
    for (const record of records) {
      try {
        const parsedData = dataParser.parseDistrictData(record);
        
        const updateResult = await MGNREGAData.updateOne(
          {
            district_code: parsedData.district_code,
            fin_year: parsedData.fin_year,
            month: parsedData.month
          },
          { $set: parsedData },
          { upsert: true }
        );

        if (updateResult.upsertedCount) inserted++;
        if (updateResult.modifiedCount) updated++;

        // Also update/create district record
        await District.updateOne(
          { district_code: parsedData.district_code },
          {
            $set: {
              district_name: parsedData.district_name,
              state_code: parsedData.state_code,
              state_name: parsedData.state_name,
              last_updated: new Date()
            }
          },
          { upsert: true }
        );

      } catch (error) {
        logger.error(`Failed to process record:`, error.message);
      }
    }

    logger.info(`Synced ${records.length} records for ${state.state_name}`);

    res.status(200).json({
      success: true,
      state: state.state_name,
      finYear: finYear,
      total: records.length,
      inserted,
      updated,
      message: 'State data synced successfully'
    });

  } catch (error) {
    logger.error('Error in syncStateData:', error);
    next(error);
  }
};
