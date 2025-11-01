
const mongoose = require('mongoose');
const MGNREGAData = require('../models/MGNREGAData');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');


exports.getHealth = async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {}
    };

    
    health.services.mongodb = {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState
    };

    
    const cacheStats = cacheService.getStats();
    health.services.cache = {
      status: 'active',
      keys: cacheStats.keys,
      hitRate: `${cacheStats.hitRate}%`
    };

    
    const memUsage = process.memoryUsage();
    health.memory = {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
    };

    
    const overallStatus = health.services.mongodb.status === 'connected' ? 200 : 503;

    res.status(overallStatus).json({
      success: true,
      ...health
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
};


exports.getStats = async (req, res, next) => {
  try {
    const cacheStats = cacheService.getStats();

    
    const totalRecords = await MGNREGAData.countDocuments();
    const recentRecords = await MGNREGAData.countDocuments({
      updated_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    
    const activeDistricts = await MGNREGAData.aggregate([
      {
        $group: {
          _id: '$district_code',
          district_name: { $first: '$district_name' },
          count: { $sum: 1 },
          lastUpdated: { $max: '$updated_at' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      cache: cacheStats,
      database: {
        totalRecords,
        recentRecords,
        activeDistricts
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in getStats:', error);
    next(error);
  }
};


exports.getPopularDistricts = async (req, res, next) => {
  try {
    
    const popular = await MGNREGAData.aggregate([
      {
        $match: {
          updated_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$district_code',
          district_name: { $first: '$district_name' },
          state_name: { $first: '$state_name' },
          queryCount: { $sum: 1 },
          lastAccessed: { $max: '$updated_at' }
        }
      },
      { $sort: { queryCount: -1 } },
      { $limit: 100 }
    ]);

    res.status(200).json({
      success: true,
      count: popular.length,
      data: popular,
      period: 'Last 7 days'
    });

  } catch (error) {
    logger.error('Error in getPopularDistricts:', error);
    next(error);
  }
};

module.exports = exports;