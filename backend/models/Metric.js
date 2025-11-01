
const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  district_code: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  workers: {
    type: Number,
    default: 0
  },
  person_days: {
    type: Number,
    default: 0
  },
  wages_paid: {
    type: Number,
    default: 0
  },
  avg_wage: {
    type: Number,
    default: 0
  },
  job_cards: {
    type: Number,
    default: 0
  },
  days_per_household: {
    type: Number,
    default: 0
  },
  payment_timely_pct: {
    type: Number,
    default: 0
  },
  funds_released: {
    type: Number,
    default: 0
  },
  funds_spent: {
    type: Number,
    default: 0
  },
  complaints: {
    type: Number,
    default: 0
  },
  data_timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['api', 'manual', 'etl'],
    default: 'api'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MetricSchema.index({ districtId: 1, year: -1, month: -1 });
MetricSchema.index({ year: -1, month: -1 });

module.exports = mongoose.model('Metric', MetricSchema);
