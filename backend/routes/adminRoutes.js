const express = require('express');
const {
  uploadData,
  triggerSync,
  getSyncStatus,
  clearCache,
  getStats,
  getSnapshots
} = require('../controllers/adminController');



const router = express.Router();


router.post('/upload', uploadData);
router.post('/sync', triggerSync);
router.get('/sync-status', getSyncStatus);
router.post('/clear-cache', clearCache);
router.get('/stats', getStats);
router.get('/snapshots', getSnapshots);

module.exports = router;