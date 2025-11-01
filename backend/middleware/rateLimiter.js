const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');


const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }
});


const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 30,
  message: {
    success: false,
    error: 'Too many data requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    
    return req.fromCache === true;
  }
});


const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many heavy requests, please try again later'
  }
});

module.exports = {
  generalLimiter,
  dataLimiter,
  heavyLimiter
};














