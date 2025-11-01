const { cache, cacheKeys, cacheTTL } = require('../config/cache');
const logger = require('../utils/logger');

class CacheService {
  /**
   * Get data with cache-first strategy
   */
  async getOrFetch(key, fetchFn, ttl = cacheTTL.HOT_DATA) {
    // Try cache first
    const cached = cache.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return { ...cached, fromCache: true };
    }

    // Cache miss - fetch data
    logger.debug(`Cache MISS: ${key}`);
    const data = await fetchFn();
    
    if (data) {
      cache.set(key, data, ttl);
    }

    return { ...data, fromCache: false };
  }

  /**
   * Invalidate cache for district
   */
  invalidateDistrict(districtCode) {
    const keys = cache.keys();
    const districtKeys = keys.filter(k => k.includes(districtCode));
    
    districtKeys.forEach(key => cache.del(key));
    logger.info(`Invalidated ${districtKeys.length} cache keys for district ${districtCode}`);
  }

  /**
   * Warm cache for popular districts
   */
  async warmCache(districts, fetchFn) {
    logger.info(`Warming cache for ${districts.length} districts`);
    
    const promises = districts.map(async (district) => {
      try {
        const key = cacheKeys.districtData(district.code, district.month, district.year);
        const data = await fetchFn(district.code, district.month, district.year);
        cache.set(key, data, cacheTTL.HOT_DATA);
      } catch (error) {
        logger.error(`Cache warming failed for ${district.code}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
    logger.info('Cache warming completed');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return cache.getStats();
  }

  /**
   * Clear all cache
   */
  clearAll() {
    cache.flush();
    logger.info('Cache cleared');
  }
}

module.exports = new CacheService();
