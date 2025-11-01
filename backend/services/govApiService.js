const axios = require('axios');
const logger = require('../utils/logger');
const { retryWithBackoff, withTimeout } = require('../utils/retry');
const { cache } = require('../config/cache');

class GovApiService {
  constructor() {
    this.baseURL = process.env.GOV_API_BASE_URL;
    this.apiKey = process.env.GOV_API_KEY;
    this.timeout = parseInt(process.env.API_TIMEOUT) || 10000;
    this.maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
    this.apiLimit = parseInt(process.env.API_LIMIT) || 1000;
  }

  /**
   * Fetch data by state and financial year
   * This is the primary method matching the government API structure
   */
  async fetchByStateAndYear(stateName, finYear) {
    const startTime = Date.now();
    
    try {
      cache.incrementApiCalls();
      
      const response = await retryWithBackoff(
        async () => {
          return await withTimeout(
            axios.get(this.baseURL, {
              params: {
                'api-key': this.apiKey,
                format: 'json',
                limit: this.apiLimit,
                'filters[state_name]': stateName,
                'filters[fin_year]': finYear
              },
              timeout: this.timeout
            }),
            this.timeout
          );
        },
        this.maxRetries
      );

      const duration = Date.now() - startTime;
      logger.info(`API call successful for ${stateName} (${finYear}) in ${duration}ms`);

      return {
        success: true,
        data: response.data.records || [],
        total: response.data.total || 0,
        source: 'api'
      };

    } catch (error) {
      logger.error(`Government API error for ${stateName}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        source: 'api'
      };
    }
  }

  /**
   * Fetch district data from government API
   * Now fetches by state and filters by district
   */
  async fetchDistrictData(districtCode, month, year, stateName = null) {
    const startTime = Date.now();
    
    try {
      cache.incrementApiCalls();

      // If state name not provided, try to find it from database
      if (!stateName) {
        const District = require('../models/District');
        const district = await District.findOne({ district_code: districtCode }).lean();
        if (district) {
          stateName = district.state_name;
        } else {
          throw new Error('State name required for API call');
        }
      }
      
      const response = await retryWithBackoff(
        async () => {
          return await withTimeout(
            axios.get(this.baseURL, {
              params: {
                'api-key': this.apiKey,
                format: 'json',
                limit: this.apiLimit,
                'filters[state_name]': stateName,
                'filters[fin_year]': year,
                'filters[district_code]': districtCode,
                'filters[month]': month
              },
              timeout: this.timeout
            }),
            this.timeout
          );
        },
        this.maxRetries
      );

      const duration = Date.now() - startTime;
      logger.info(`API call successful for district ${districtCode} in ${duration}ms`);

      // Return first matching record
      const records = response.data.records || [];
      if (records.length > 0) {
        return {
          success: true,
          data: records[0],
          source: 'api'
        };
      }

      return {
        success: false,
        error: 'No data found',
        source: 'api'
      };

    } catch (error) {
      logger.error(`Government API error for district ${districtCode}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        source: 'api'
      };
    }
  }

  /**
   * Fetch all states from API
   * Get unique states from the data
   */
  async fetchStates() {
    try {
      const response = await retryWithBackoff(
        async () => {
          return await withTimeout(
            axios.get(this.baseURL, {
              params: {
                'api-key': this.apiKey,
                format: 'json',
                limit: 100
              },
              timeout: this.timeout
            }),
            this.timeout
          );
        },
        this.maxRetries
      );

      const records = response.data.records || [];
      
      // Extract unique states
      const statesMap = new Map();
      records.forEach(record => {
        if (record.state_code && record.state_name) {
          statesMap.set(record.state_code, {
            state_code: record.state_code,
            state_name: record.state_name
          });
        }
      });

      const states = Array.from(statesMap.values());

      return {
        success: true,
        data: states
      };

    } catch (error) {
      logger.error('Failed to fetch states:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch districts for a state
   * Get unique districts from state data
   */
  async fetchDistricts(stateCode, stateName = null) {
    try {
      // If state name not provided, fetch it first
      if (!stateName) {
        const State = require('../models/State');
        const state = await State.findOne({ state_code: stateCode }).lean();
        if (state) {
          stateName = state.state_name;
        }
      }

      if (!stateName) {
        throw new Error('State name required to fetch districts');
      }

      const response = await retryWithBackoff(
        async () => {
          return await withTimeout(
            axios.get(this.baseURL, {
              params: {
                'api-key': this.apiKey,
                format: 'json',
                limit: this.apiLimit,
                'filters[state_name]': stateName
              },
              timeout: this.timeout
            }),
            this.timeout
          );
        },
        this.maxRetries
      );

      const records = response.data.records || [];
      
      // Extract unique districts
      const districtsMap = new Map();
      records.forEach(record => {
        if (record.district_code && record.district_name) {
          districtsMap.set(record.district_code, {
            district_code: record.district_code,
            district_name: record.district_name,
            state_code: record.state_code,
            state_name: record.state_name
          });
        }
      });

      const districts = Array.from(districtsMap.values());

      return {
        success: true,
        data: districts
      };

    } catch (error) {
      logger.error(`Failed to fetch districts for state ${stateCode}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch all available financial years
   */
  async fetchFinancialYears() {
    try {
      const response = await retryWithBackoff(
        async () => {
          return await withTimeout(
            axios.get(this.baseURL, {
              params: {
                'api-key': this.apiKey,
                format: 'json',
                limit: 100
              },
              timeout: this.timeout
            }),
            this.timeout
          );
        },
        this.maxRetries
      );

      const records = response.data.records || [];
      
      // Extract unique financial years
      const years = [...new Set(records.map(r => r.fin_year))].filter(Boolean);

      return {
        success: true,
        data: years.sort()
      };

    } catch (error) {
      logger.error('Failed to fetch financial years:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GovApiService();