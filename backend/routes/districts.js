
const express = require('express');
const {
  getDistrictData,
  getDistrictHistory,
  getDistrictComparison
} = require('../controllers/districtController');
const { dataLimiter, heavyLimiter } = require('../middleware/rateLimiter');
const {
  validateDistrictData,
  validateHistory
} = require('../middleware/validator');

const router = express.Router();

// GET /api/v1/district/:districtCode/data
router.get(
  '/district/:districtCode/data',
  dataLimiter,
  validateDistrictData,
  getDistrictData
);

// GET /api/v1/district/:districtCode/history
router.get(
  '/district/:districtCode/history',
  heavyLimiter,
  validateHistory,
  getDistrictHistory
);

// GET /api/v1/district/:districtCode/comparison
router.get(
  '/district/:districtCode/comparison',
  dataLimiter,
  getDistrictComparison
);

module.exports = router;
