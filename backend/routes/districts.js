
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


router.get(
  '/district/:districtCode/data',
  dataLimiter,
  validateDistrictData,
  getDistrictData
);


router.get(
  '/district/:districtCode/history',
  heavyLimiter,
  validateHistory,
  getDistrictHistory
);


router.get(
  '/district/:districtCode/comparison',
  dataLimiter,
  getDistrictComparison
);

module.exports = router;
