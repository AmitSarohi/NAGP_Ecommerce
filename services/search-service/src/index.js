const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const searchRoutes = require('./routes/search');
const indexRoutes = require('./routes/index');
const healthRoutes = require('./routes/health');
const { initializeOpenSearch } = require('./config/opensearch');

const app = express();
const PORT = process.env.PORT || 3003;

let server; // ✅ FIXED (global reference)

// 🚀 STARTUP LOG
console.log("🚀 Starting Search Service...");

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/index', indexRoutes);

// Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Search Service API',
      version: '1.0.0',
      description: 'Search microservice API documentation with OpenSearch',
    },
    servers: [
      {
        url: '/api', // ✅ FIXED (no localhost)
        description: 'Production server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
});

// Graceful shutdown (FIXED)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
    });
  }
});

// 🚀 START SERVER (SAFE)
const startServer = async () => {
  try {
    // ✅ NON-BLOCKING INIT
    try {
      await initializeOpenSearch();
    } catch (err) {
      console.error("⚠️ OpenSearch init failed, continuing...");
    }

    server = app.listen(PORT, () => {
      console.log(`✅ Search Service running on port ${PORT}`);
      console.log(`📄 Docs: /api/docs`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;