// utils/cacheHelper.js
// In-memory cache implementation (Redis removed)

const NodeCache = require('node-cache');
const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hour default
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Performance optimization
});

const DEFAULT_EXPIRY = 3600; // 1 hour

class CacheHelper {
  static async get(key) {
    try {
      const data = cache.get(key);
      return data || null;
    } catch (err) {
      console.error(`Cache get error for key ${key}:`, err.message);
      return null;
    }
  }

  static async set(key, value, expirySeconds = DEFAULT_EXPIRY) {
    try {
      cache.set(key, value, expirySeconds);
      return true;
    } catch (err) {
      console.error(`Cache set error for key ${key}:`, err.message);
      return false;
    }
  }

  static async del(key) {
    try {
      cache.del(key);
      return true;
    } catch (err) {
      console.error(`Cache delete error for key ${key}:`, err.message);
      return false;
    }
  }

  static async delPattern(pattern) {
    try {
      const keys = cache.keys();
      const matchingKeys = keys.filter(key => {
        const regexPattern = pattern.replace(/\*/g, '.*');
        return new RegExp(regexPattern).test(key);
      });
      
      if (matchingKeys.length > 0) {
        cache.del(matchingKeys);
      }
      return true;
    } catch (err) {
      console.error(`Cache delete pattern error for ${pattern}:`, err.message);
      return false;
    }
  }

  static async flush() {
    try {
      cache.flushAll();
      return true;
    } catch (err) {
      console.error('Cache flush error:', err.message);
      return false;
    }
  }

  // Get cache statistics
  static getStats() {
    return cache.getStats();
  }

  // Generate cache key for metrics
  static getMetricKey(districtId, year, month) {
    return `metric:${districtId}:${year}:${month}`;
  }

  // Generate cache key for district list
  static getDistrictListKey(stateId) {
    return `districts:state:${stateId}`;
  }

  // Generate cache key for comparison
  static getComparisonKey(districtId, year, month) {
    return `comparison:${districtId}:${year}:${month}`;
  }
}

module.exports = CacheHelper;

// const { getRedisClient } = require('../config/redis');

// const DEFAULT_EXPIRY = 3600; // 1 hour

// class CacheHelper {
//   static async get(key) {
//     try {
//       const client = getRedisClient();
//       if (!client || !client.isOpen) return null;

//       const data = await client.get(key);
//       return data ? JSON.parse(data) : null;
//     } catch (err) {
//       console.error(`Cache get error for key ${key}:`, err.message);
//       return null;
//     }
//   }

//   static async set(key, value, expirySeconds = DEFAULT_EXPIRY) {
//     try {
//       const client = getRedisClient();
//       if (!client || !client.isOpen) return false;

//       await client.setEx(key, expirySeconds, JSON.stringify(value));
//       return true;
//     } catch (err) {
//       console.error(`Cache set error for key ${key}:`, err.message);
//       return false;
//     }
//   }

//   static async del(key) {
//     try {
//       const client = getRedisClient();
//       if (!client || !client.isOpen) return false;

//       await client.del(key);
//       return true;
//     } catch (err) {
//       console.error(`Cache delete error for key ${key}:`, err.message);
//       return false;
//     }
//   }

//   static async delPattern(pattern) {
//     try {
//       const client = getRedisClient();
//       if (!client || !client.isOpen) return false;

//       const keys = await client.keys(pattern);
//       if (keys.length > 0) {
//         await client.del(keys);
//       }
//       return true;
//     } catch (err) {
//       console.error(`Cache delete pattern error for ${pattern}:`, err.message);
//       return false;
//     }
//   }

//   static async flush() {
//     try {
//       const client = getRedisClient();
//       if (!client || !client.isOpen) return false;

//       await client.flushAll();
//       return true;
//     } catch (err) {
//       console.error('Cache flush error:', err.message);
//       return false;
//     }
//   }

//   // Generate cache key for metrics
//   static getMetricKey(districtId, year, month) {
//     return `metric:${districtId}:${year}:${month}`;
//   }

//   // Generate cache key for district list
//   static getDistrictListKey(stateId) {
//     return `districts:state:${stateId}`;
//   }

//   // Generate cache key for comparison
//   static getComparisonKey(districtId, year, month) {
//     return `comparison:${districtId}:${year}:${month}`;
//   }
// }

// module.exports = CacheHelper;