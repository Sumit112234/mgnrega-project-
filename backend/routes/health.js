const express = require('express');
const {
  getHealth,
  getStats,
  getPopularDistricts
} = require('../controllers/healthController');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// GET /api/v1/health
router.get('/health', getHealth);

// GET /api/v1/stats
router.get('/stats', generalLimiter, getStats);

// GET /api/v1/popular-districts
router.get('/popular-districts', generalLimiter, getPopularDistricts);

module.exports = router;