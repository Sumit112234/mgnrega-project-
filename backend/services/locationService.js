const axios = require('axios');
const { cache, cacheKeys, cacheTTL } = require('../config/cache');
const logger = require('../utils/logger');

class LocationService {
  /**
   * Detect location from IP address
   */
  async detectLocation(ip) {
    // Check cache first
    const cacheKey = cacheKeys.locationMap(ip);
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Use IP geolocation service (free tier available)
      const response = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 5000
      });

      if (response.data.status === 'success') {
        const location = {
          state: response.data.regionName,
          stateCode: this.getStateCode(response.data.regionName),
          city: response.data.city,
          country: response.data.country
        };

        // Cache for 7 days
        cache.set(cacheKey, location, cacheTTL.LOCATION);
        return location;
      }

      return null;

    } catch (error) {
      logger.error('Location detection failed:', error.message);
      return null;
    }
  }

  /**
   * Get coordinates from location
   */
  async getCoordinates(location) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: location,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'MGNREGA-App/1.0'
        },
        timeout: 5000
      });

      if (response.data.length > 0) {
        return {
          lat: parseFloat(response.data[0].lat),
          lon: parseFloat(response.data[0].lon)
        };
      }

      return null;

    } catch (error) {
      logger.error('Geocoding failed:', error.message);
      return null;
    }
  }

  /**
   * Map state name to state code
   */
  getStateCode(stateName) {
    const stateMap = {
      'Andhra Pradesh': 'AP',
      'Arunachal Pradesh': 'AR',
      'Assam': 'AS',
      'Bihar': 'BR',
      'Chhattisgarh': 'CG',
      'Goa': 'GA',
      'Gujarat': 'GJ',
      'Haryana': 'HR',
      'Himachal Pradesh': 'HP',
      'Jharkhand': 'JH',
      'Karnataka': 'KA',
      'Kerala': 'KL',
      'Madhya Pradesh': 'MP',
      'Maharashtra': 'MH',
      'Manipur': 'MN',
      'Meghalaya': 'ML',
      'Mizoram': 'MZ',
      'Nagaland': 'NL',
      'Odisha': 'OR',
      'Punjab': 'PB',
      'Rajasthan': 'RJ',
      'Sikkim': 'SK',
      'Tamil Nadu': 'TN',
      'Telangana': 'TG',
      'Tripura': 'TR',
      'Uttar Pradesh': 'UP',
      'Uttarakhand': 'UK',
      'West Bengal': 'WB'
    };

    return stateMap[stateName] || null;
  }
}

module.exports = new LocationService();