const express = require('express');
const {
  getDistrictMetrics,
  getDistrictHistory,
  compareWithState
} = require('../controllers/metricController');

const router = express.Router();

router.get('/districts/:districtId', getDistrictMetrics);
router.get('/districts/:districtId/history', getDistrictHistory);
router.get('/districts/:districtId/compare', compareWithState);

module.exports = router;
