const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  district_code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  district_name: {
    type: String,
    required: true
  },
  state_code: {
    type: String,
    required: true,
    index: true
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

// Compound index for state queries
districtSchema.index({ state_code: 1, district_code: 1 });

module.exports = mongoose.model('District', districtSchema);


// // models/District.js
// const mongoose = require('mongoose');

// const DistrictSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   state: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   district_code: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   geo_boundary: {
//     type: {
//       type: String,
//       enum: ['Polygon', 'MultiPolygon'],
//       default: 'Polygon'
//     },
//     coordinates: {
//       type: [[[Number]]],
//       required: false
//     }
//   },
//   population: {
//     type: Number,
//     default: 0
//   },
//   households: {
//     type: Number,
//     default: 0
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// DistrictSchema.index({ geo_boundary: '2dsphere' });

// module.exports = mongoose.model('District', DistrictSchema);

