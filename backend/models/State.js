const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  state_code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  state_name: {
    type: String,
    required: true
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('State', stateSchema);