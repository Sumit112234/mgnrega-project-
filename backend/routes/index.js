const express = require('express');
const statesRouter = require('./states');
const districtsRouter = require('./districts');
const healthRouter = require('./health');

const router = express.Router();

// Mount routes
router.use('/states', statesRouter);
router.use('/', districtsRouter); // District routes at root level
router.use('/', healthRouter); // Health routes at root level

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MGNREGA Data Visualization API v1',
    version: '1.0.0',
    endpoints: {
      states: 'POST /api/v1/states',
      syncState: 'POST /api/v1/states/:stateCode/sync?finYear=2022-2023',
      districts: 'GET /api/v1/states/:stateCode/districts',
      districtData: 'GET /api/v1/district/:districtCode/data?month=Dec&year=2024-2025',
      districtHistory: 'GET /api/v1/district/:districtCode/history?startDate=2020-01&endDate=2025-10',
      districtComparison: 'GET /api/v1/district/:districtCode/comparison',
      health: 'GET /api/v1/health',
      stats: 'GET /api/v1/stats',
      popularDistricts: 'GET /api/v1/popular-districts'
    },
    note: 'API fetches data by state. Use syncState endpoint to populate database with state data.'
  });
});

module.exports = router;