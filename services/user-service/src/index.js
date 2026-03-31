const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const { initializeDynamoDB } = require('./config/database');
const { initializeOAuth, passport } = require('./config/oauth');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { userOperations } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Seed initial admin user
const seedAdminUser = async () => {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Admin';
  const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'User';

  try {
    // Check if admin already exists
    const existingAdmin = await userOperations.getUserByEmail(ADMIN_EMAIL);
    
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        // Update existing user to admin
        await userOperations.updateUser(existingAdmin.userId, {
          firstName: existingAdmin.firstName,
          lastName: existingAdmin.lastName,
          role: 'admin'
        });
        console.log('✅ Updated existing user to admin:', ADMIN_EMAIL);
      } else {
        console.log('✅ Admin user already exists:', ADMIN_EMAIL);
      }
      return;
    }

    // Create new admin user
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    await userOperations.createUser({
      userId,
      email: ADMIN_EMAIL,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Created initial admin user:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   ⚠️  Change default credentials in production!');
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error.message);
  }
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Initialize Passport for OAuth
app.use(passport.initialize());
initializeOAuth();

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Swagger documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'User management microservice API documentation',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

const startServer = async () => {
  try {
    await initializeDynamoDB();
    
    // Seed admin user after DB initialization
    await seedAdminUser();
    
    const server = app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
