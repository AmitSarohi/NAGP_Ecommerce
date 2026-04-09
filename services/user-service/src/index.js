const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');

const { initializeDynamoDB, userOperations } = require('./config/database');
const { initializeOAuth, passport } = require('./config/oauth');

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

let server;


/* =========================
   SEED ADMIN USER
========================= */
const seedAdminUser = async () => {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await userOperations.getUserByEmail(ADMIN_EMAIL);

    if (admin) {
      if (admin.role !== 'admin') {
        await userOperations.updateUser(admin.userId, { role: 'admin' });
        console.log('🔄 Updated user to admin:', ADMIN_EMAIL);
      } else {
        console.log('✅ Admin already exists:', ADMIN_EMAIL);
      }
      return;
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await userOperations.createUser({
      userId,
      email: ADMIN_EMAIL,
      firstName: 'Admin',
      lastName: 'User',
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin created:', ADMIN_EMAIL);
  } catch (error) {
    console.error('❌ Admin seed error:', error.message);
  }
};

/* =========================
   SECURITY MIDDLEWARE
========================= */
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

app.use(morgan('combined'));

/* =========================
   BODY PARSER
========================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   RATE LIMIT
========================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use('/api', limiter);

/* =========================
   ROOT (Health check)
========================= */
app.get('/', (req, res) => {
  res.json({
    service: 'user-service',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   OAUTH INIT
========================= */
app.use(passport.initialize());
initializeOAuth();

/* =========================
   ROUTES
========================= */
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

/* =========================
   SWAGGER
========================= */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
      },
    ],
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

/* =========================
   404 HANDLER
========================= */
app.use('*', (req, res) => {
  res.status(404).json({
    error: { message: 'Route not found' },
  });
});

/* =========================
   GRACEFUL SHUTDOWN
========================= */
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server?.close(() => console.log('Server stopped'));
});

/* =========================
   START SERVER
========================= */
const startServer = async () => {
  try {
    await initializeDynamoDB();
    await seedAdminUser();

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📘 Docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;