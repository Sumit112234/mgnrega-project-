const express = require('express');
const {
  getHealth,
  getStats,
  getPopularDistricts
} = require('../controllers/healthController');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();


router.get('/health', getHealth);


router.get('/stats', generalLimiter, getStats);


router.get('/popular-districts', generalLimiter, getPopularDistricts);

module.exports = router;