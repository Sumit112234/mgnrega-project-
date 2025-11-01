const express = require('express');
const {
  getStates,
  getDistrictsByState,
  getDistrict,
  getDistrictByLocation,
  searchDistricts
} = require('../controllers/districtController');

console.log("districtRoutes loaded");

const router = express.Router();

router.get('/states', getStates);
router.get('/states/:stateId/districts', getDistrictsByState);
router.get('/search', searchDistricts);
router.post('/by-location', getDistrictByLocation);
router.get('/:id', getDistrict);

module.exports = router;

