// utils/fetchDataGov.js
const axios = require('axios');
const District = require('../models/District');
const Metric = require('../models/Metric');
const Snapshot = require('../models/Snapshot');

class DataGovFetcher {
  constructor() {
    this.baseURL = process.env.DATA_GOV_API_URL || 'https://api.data.gov.in/resource';
    this.apiKey = process.env.DATA_GOV_API_KEY;
    this.timeout = 30000; // 30 seconds
  }

  // Fetch MGNREGA data from data.gov.in
  async fetchMGNREGAData(params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/mgnrega`, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          ...params
        },
        timeout: this.timeout
      });

      return response.data;
    } catch (err) {
      console.error('Data.gov.in API Error:', err.message);
      throw new Error(`Failed to fetch data from data.gov.in: ${err.message}`);
    }
  }

  // Transform raw API data to our schema
  transformData(rawData) {
    if (!rawData || !rawData.records) {
      throw new Error('Invalid data format from API');
    }

    const records = rawData.records.map(record => ({
      district_code: record.district_code || record.districtCode,
      district_name: record.district_name || record.districtName,
      state: record.state_name || record.stateName,
      year: parseInt(record.financial_year || record.year),
      month: parseInt(record.month),
      workers: parseInt(record.total_workers || 0),
      person_days: parseFloat(record.persondays_generated || 0),
      wages_paid: parseFloat(record.total_wages_paid || 0),
      avg_wage: parseFloat(record.average_wage || 0),
      job_cards: parseInt(record.job_cards_issued || 0),
      days_per_household: parseFloat(record.average_days_per_household || 0),
      payment_timely_pct: parseFloat(record.timely_payment_percentage || 0),
      funds_released: parseFloat(record.funds_released || 0),
      funds_spent: parseFloat(record.funds_utilized || 0),
      complaints: parseInt(record.complaints_received || 0)
    }));

    return records;
  }

  // Fetch and save data for specific district and period
  async fetchAndSave(districtCode, year, month) {
    const startTime = Date.now();
    
    try {
      // Fetch from API
      const rawData = await this.fetchMGNREGAData({
        district_code: districtCode,
        year,
        month
      });

      // Create snapshot
      await Snapshot.create({
        source: 'data_gov_api',
        raw_data: rawData,
        record_count: rawData.records?.length || 0,
        success: true,
        processing_time_ms: Date.now() - startTime
      });

      // Transform data
      const transformedData = this.transformData(rawData);

      if (transformedData.length === 0) {
        return null;
      }

      // Get or create district
      let district = await District.findOne({ district_code: districtCode });
      
      if (!district) {
        district = await District.create({
          name: transformedData[0].district_name,
          state: transformedData[0].state,
          district_code: districtCode
        });
      }

      // Save or update metric
      const metricData = {
        districtId: district._id,
        district_code: districtCode,
        year,
        month,
        ...transformedData[0],
        source: 'api',
        data_timestamp: new Date()
      };

      const metric = await Metric.findOneAndUpdate(
        { districtId: district._id, year, month },
        metricData,
        { upsert: true, new: true }
      );

      return metric;
    } catch (err) {
      // Save failed snapshot
      await Snapshot.create({
        source: 'data_gov_api',
        raw_data: { error: err.message },
        success: false,
        error_message: err.message,
        processing_time_ms: Date.now() - startTime
      });

      throw err;
    }
  }

  // Bulk fetch for multiple districts
  async bulkFetch(year, month, states = []) {
    try {
      const params = { year, month };
      if (states.length > 0) {
        params.state = states.join(',');
      }

      const rawData = await this.fetchMGNREGAData(params);
      const transformedData = this.transformData(rawData);

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const record of transformedData) {
        try {
          let district = await District.findOne({ district_code: record.district_code });
          
          if (!district) {
            district = await District.create({
              name: record.district_name,
              state: record.state,
              district_code: record.district_code
            });
          }

          await Metric.findOneAndUpdate(
            { districtId: district._id, year, month },
            {
              districtId: district._id,
              district_code: record.district_code,
              year,
              month,
              workers: record.workers,
              person_days: record.person_days,
              wages_paid: record.wages_paid,
              avg_wage: record.avg_wage,
              job_cards: record.job_cards,
              days_per_household: record.days_per_household,
              payment_timely_pct: record.payment_timely_pct,
              funds_released: record.funds_released,
              funds_spent: record.funds_spent,
              complaints: record.complaints,
              source: 'etl',
              data_timestamp: new Date()
            },
            { upsert: true, new: true }
          );

          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            district_code: record.district_code,
            error: err.message
          });
        }
      }

      return results;
    } catch (err) {
      throw new Error(`Bulk fetch failed: ${err.message}`);
    }
  }
}

module.exports = new DataGovFetcher();