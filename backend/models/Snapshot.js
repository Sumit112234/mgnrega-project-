const mongoose = require('mongoose');

const SnapshotSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    enum: ['data_gov_api', 'manual_upload', 'scheduled_sync']
  },
  fetched_at: {
    type: Date,
    default: Date.now
  },
  raw_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  record_count: {
    type: Number,
    default: 0
  },
  success: {
    type: Boolean,
    default: true
  },
  error_message: {
    type: String,
    default: null
  },
  processing_time_ms: {
    type: Number,
    default: 0
  }
});

SnapshotSchema.index({ fetched_at: -1 });

module.exports = mongoose.model('Snapshot', SnapshotSchema);