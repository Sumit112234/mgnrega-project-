const NodeCache = require('node-cache');

// Main cache instance
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes default
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Better performance
  deleteOnExpire: true
});

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  apiCalls: 0
};

// Cache key generators
const cacheKeys = {
  districtData: (districtCode, month, year) => `district:${districtCode}:${year}:${month}`,
  districtHistory: (districtCode, startDate, endDate) => `history:${districtCode}:${startDate}:${endDate}`,
  districtComparison: (districtCode) => `comparison:${districtCode}`,
  stateDistricts: (stateCode) => `state:${stateCode}:districts`,
  locationMap: (ip) => `location:${ip}`,
  popularDistricts: () => 'popular:districts'
};

// Cache wrapper with statistics
const cacheWrapper = {
  get: (key) => {
    const value = cache.get(key);
    if (value !== undefined) {
      cacheStats.hits++;
      return value;
    }
    cacheStats.misses++;
    return null;
  },

  set: (key, value, ttl = null) => {
    if (ttl) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  },

  del: (key) => {
    return cache.del(key);
  },

  flush: () => {
    return cache.flushAll();
  },

  keys: () => {
    return cache.keys();
  },

  getStats: () => {
    const total = cacheStats.hits + cacheStats.misses;
    return {
      ...cacheStats,
      hitRate: total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) : 0,
      keys: cache.keys().length,
      size: cache.getStats()
    };
  },

  incrementApiCalls: () => {
    cacheStats.apiCalls++;
  }
};

// TTL configurations for different data types
const cacheTTL = {
  HOT_DATA: 300,        // 5 minutes - current month
  HISTORICAL: 3600,     // 1 hour - historical data
  DISTRICTS: 86400,     // 24 hours - district list
  LOCATION: 604800,     // 7 days - location mappings
  COMPARISON: 1800      // 30 minutes - comparison data
};

module.exports = {
  cache: cacheWrapper,
  cacheKeys,
  cacheTTL
};