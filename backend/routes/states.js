const express = require('express');
const { fetchStates, syncStateData } = require('../controllers/stateController');
const { getDistricts } = require('../controllers/districtController');
const { generalLimiter } = require('../middleware/rateLimiter');
const { validateStateCode } = require('../middleware/validator');

const router = express.Router();

// POST /api/v1/states - Fetch and store all states
router.post('/', generalLimiter, fetchStates);

// POST /api/v1/states/:stateCode/sync - Sync all data for a state
router.post('/:stateCode/sync', generalLimiter, validateStateCode, syncStateData);

// GET /api/v1/states/:stateCode/districts - Get districts for a state
router.get('/:stateCode/districts', generalLimiter, validateStateCode, getDistricts);

module.exports = router;
