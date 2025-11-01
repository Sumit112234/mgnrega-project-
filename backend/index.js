const express = require("express");
const app = express();

// default route
app.get("/", (req, res) => {
  res.send("Hello, Express Server is Running!");
});

// start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



// require('dotenv').config();
// const connectDB = require('./config/db')
// const logger = require('./utils/logger');
// const { startCronJobs } = require('./cron/dataRefresh');
// const express = require('express');
// const helmet = require('helmet');
// const cors = require('cors');
// const mongoSanitize = require('express-mongo-sanitize');
// const compression = require('compression');
// const morgan = require('morgan');
// const routes = require('./routes');
// const errorHandler = require('./middleware/errorHandler');


// const app = express();

// // Trust proxy for rate limiting behind reverse proxy
// app.set('trust proxy', 1);

// // Security middleware
// app.use(helmet());

// // CORS configuration
// const corsOptions = {
//   origin: (origin, callback) => {
//     const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   optionsSuccessStatus: 200
// };
// app.use(cors({
//   allowedOrigins : process.env.FRONTEND_URL,
//   credentials: true
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Sanitize data to prevent NoSQL injection
// // app.use(mongoSanitize());

// // Compression middleware
// app.use(compression());

// // Request logging
// const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
// app.use(morgan(morganFormat, {
//   stream: {
//     write: (message) => logger.http(message.trim())
//   }
// }));

// // API versioning
// app.use('/api/v1', routes);

// // Health check endpoint (no versioning)
// app.get('/health', (req, res) => {
//   res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
// });
// app.get('/', (req, res) => {
//   res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Route not found',
//     path: req.originalUrl
//   });
// });

// // Global error handler
// app.use(errorHandler);


// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Start cron jobs
// if (process.env.NODE_ENV === 'production') {
//   startCronJobs();
//   logger.info('Cron jobs started');
// }

// // Start server
// const server = app.listen(PORT, () => {
//   logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// });

// // Graceful shutdown
// const gracefulShutdown = (signal) => {
//   logger.info(`${signal} received. Starting graceful shutdown...`);
  
//   server.close(() => {
//     logger.info('HTTP server closed');
    
//     // Close database connections
//     require('mongoose').connection.close(false, () => {
//       logger.info('MongoDB connection closed');
//       process.exit(0);
//     });
//   });

//   // Force shutdown after 30 seconds
//   setTimeout(() => {
//     logger.error('Forced shutdown after timeout');
//     process.exit(1);
//   }, 30000);
// };

// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// // Handle unhandled rejections
// process.on('unhandledRejection', (err) => {
//   logger.error('Unhandled Rejection:', err);
//   gracefulShutdown('UNHANDLED_REJECTION');
// });





// console.log('hello ji')
// // require('dotenv').config({ path: './config/config.env' });
// // require('dotenv').config();
// const dotenv = require('dotenv');
// const express = require('express');
// const helmet = require('helmet');
// const cors = require('cors');
// const mongoSanitize = require('express-mongo-sanitize');
// const connectDB = require('./config/db');
// // const connectRedis = require('./config/redis');
// const errorHandler = require('./middleware/errorHandler');
// const rateLimiter = require('./middleware/rateLimiter');

// // Import routes
// const districtRoutes = require('./routes/districtRoutes');
// const metricRoutes = require('./routes/metricRoutes');
// const adminRoutes = require('./routes/adminRoutes');

// // Import cron jobs
// const { startDataSyncJob } = require('./cron/dataSync');

// const app = express();
// dotenv.config()

// // Connect to MongoDB
// connectDB();

// // Connect to Redis
// // connectRedis();

// // Security middleware
// app.use(helmet());
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true
// }));

// // app.use(
// //   mongoSanitize({
// //     replaceWith: "_"
// //   })
// // );


// // Body parser
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Rate limiting
// app.use(rateLimiter);


// app.get('/', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'everything is working fine!😊',
//     timestamp: new Date().toISOString()
//   });
// });

// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString()
//   });
// });

// // API routes
// app.use('/api/v1/districts', districtRoutes);
// app.use('/api/v1/metrics', metricRoutes);
// app.use('/api/v1/admin', adminRoutes);

// // Error handler (must be last)
// app.use(errorHandler);

// // Start cron jobs
// if (process.env.ENABLE_CRON === 'true') {
//   startDataSyncJob();
//   console.log('✓ Data sync cron job started');
// }

// const PORT = process.env.PORT || 5000;

// const server = app.listen(PORT, () => {
//   console.log(`✓ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.error(`Unhandled Rejection: ${err.message}`);
//   server.close(() => process.exit(1));
// });

// module.exports = app;