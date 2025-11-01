const NodeCache = require('node-cache');


const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300, 
  checkperiod: 120, 
  useClones: false, 
  deleteOnExpire: true
});


let cacheStats = {
  hits: 0,
  misses: 0,
  apiCalls: 0
};


const cacheKeys = {
  districtData: (districtCode, month, year) => `district:${districtCode}:${year}:${month}`,
  districtHistory: (districtCode, startDate, endDate) => `history:${districtCode}:${startDate}:${endDate}`,
  districtComparison: (districtCode) => `comparison:${districtCode}`,
  stateDistricts: (stateCode) => `state:${stateCode}:districts`,
  locationMap: (ip) => `location:${ip}`,
  popularDistricts: () => 'popular:districts'
};


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


const cacheTTL = {
  HOT_DATA: 300,        
  HISTORICAL: 3600,     
  DISTRICTS: 86400,     
  LOCATION: 604800,     
  COMPARISON: 1800      
};

module.exports = {
  cache: cacheWrapper,
  cacheKeys,
  cacheTTL
};