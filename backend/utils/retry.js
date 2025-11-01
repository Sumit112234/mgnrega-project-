const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Number} maxAttempts - Maximum number of attempts
 * @param {Number} delay - Initial delay in milliseconds
 * @returns {Promise} - Result of the function
 */
const retryWithBackoff = async (fn, maxAttempts = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        logger.error(`All ${maxAttempts} retry attempts failed:`, error.message);
        throw error;
      }
      
      const waitTime = delay * Math.pow(2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed. Retrying in ${waitTime}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

/**
 * Create a timeout promise
 * @param {Number} ms - Timeout in milliseconds
 * @returns {Promise}
 */
const timeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
};

/**
 * Execute function with timeout
 * @param {Function} fn - Async function to execute
 * @param {Number} ms - Timeout in milliseconds
 * @returns {Promise}
 */
const withTimeout = (fn, ms) => {
  return Promise.race([fn(), timeout(ms)]);
};

module.exports = {
  retryWithBackoff,
  withTimeout,
  timeout
};