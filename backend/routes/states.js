const express = require('express');
const { fetchStates, syncStateData } = require('../controllers/stateController');
const { getDistricts } = require('../controllers/districtController');
const { generalLimiter } = require('../middleware/rateLimiter');
const { validateStateCode } = require('../middleware/validator');

const router = express.Router();


router.post('/', generalLimiter, fetchStates);


router.post('/:stateCode/sync', generalLimiter, validateStateCode, syncStateData);


router.get('/:stateCode/districts', generalLimiter, validateStateCode, getDistricts);

module.exports = router;
