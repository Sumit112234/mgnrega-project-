const mongoose = require('mongoose');

const mgnregaDataSchema = new mongoose.Schema({
  district_code: {
    type: String,
    required: true,
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
  fin_year: {
    type: String,
    required: true,
    index: true
  },
  month: {
    type: String,
    required: true,
    index: true
  },
  // Store complete raw data from government API
  Approved_Labour_Budget: String,
  Average_Wage_rate_per_day_per_person: String,
  Average_days_of_employment_provided_per_Household: String,
  Differently_abled_persons_worked: String,
  Material_and_skilled_Wages: String,
  Number_of_Completed_Works: String,
  Number_of_GPs_with_NIL_exp: String,
  Number_of_Ongoing_Works: String,
  Persondays_of_Central_Liability_so_far: String,
  SC_persondays: String,
  SC_workers_against_active_workers: String,
  ST_persondays: String,
  ST_workers_against_active_workers: String,
  Total_Adm_Expenditure: String,
  Total_Exp: String,
  Total_Households_Worked: String,
  Total_Individuals_Worked: String,
  Total_No_of_Active_Job_Cards: String,
  Total_No_of_Active_Workers: String,
  Total_No_of_HHs_completed_100_Days_of_Wage_Employment: String,
  Total_No_of_JobCards_issued: String,
  Total_No_of_Workers: String,
  Total_No_of_Works_Takenup: String,
  Wages: String,
  Women_Persondays: String,
  percent_of_Category_B_Works: String,
  percent_of_Expenditure_on_Agriculture_Allied_Works: String,
  percent_of_NRM_Expenditure: String,
  percentage_payments_gererated_within_15_days: String,
  Remarks: String,
  
  fetched_from: {
    type: String,
    enum: ['api', 'cache'],
    default: 'api'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
mgnregaDataSchema.index({ district_code: 1, fin_year: 1, month: 1 }, { unique: true });
mgnregaDataSchema.index({ state_code: 1, fin_year: 1 });
mgnregaDataSchema.index({ created_at: 1 }); // For cleanup queries
mgnregaDataSchema.index({ updated_at: 1 }); // For data freshness checks

// Method to check if data is stale
mgnregaDataSchema.methods.isStale = function() {
  const daysSinceUpdate = (Date.now() - this.updated_at) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > parseInt(process.env.DATA_REFRESH_DAYS || 20);
};

// Static method to find stale data
mgnregaDataSchema.statics.findStaleData = function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(process.env.DATA_REFRESH_DAYS || 20));
  return this.find({ updated_at: { $lt: cutoffDate } });
};

module.exports = mongoose.model('MGNREGAData', mgnregaDataSchema);