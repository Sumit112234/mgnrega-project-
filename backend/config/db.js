const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    logger.info('MongoDB connected successfully');

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);

//     console.log(`✓ MongoDB Connected`);

//     // Create indexes on connection
//     await createIndexes();
//   } catch (err) {
//     console.error(`MongoDB Connection Error: ${err.message}`);
//     process.exit(1);
//   }
// };

// const createIndexes = async () => {
//   try {
//     const District = require('../models/District');
//     const Metric = require('../models/Metric');

//     // District indexes
//     await District.collection.createIndex({ district_code: 1 }, { unique: true });
//     await District.collection.createIndex({ state: 1 });
//     await District.collection.createIndex({ 'geo_boundary': '2dsphere' });

//     // Metric indexes for fast queries
//     await Metric.collection.createIndex({ districtId: 1, year: -1, month: -1 });
//     await Metric.collection.createIndex({ year: -1, month: -1 });
//     await Metric.collection.createIndex({ districtId: 1 });
//     await Metric.collection.createIndex({ data_timestamp: -1 });

//     console.log('✓ Database indexes created');
//   } catch (err) {
//     console.error(`Index creation error: ${err.message}`);
//   }
// };

// module.exports = connectDB;