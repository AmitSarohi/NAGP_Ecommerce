const express = require('express');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const { docClient, PRODUCT_TABLE, CATEGORY_TABLE } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: product-service
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                         responseTime:
 *                           type: number
 *                           description: Response time in milliseconds
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connectivity for both tables
    const dbStartTime = Date.now();
    
    await Promise.all([
      docClient.get({
        TableName: PRODUCT_TABLE,
        Key: { productId: 'health-check' },
      }).promise().catch(() => ({})),
      
      docClient.get({
        TableName: CATEGORY_TABLE,
        Key: { categoryId: 'health-check' },
      }).promise().catch(() => ({})),
    ]);
    
    const dbResponseTime = Date.now() - dbStartTime;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'product-service',
      version: '1.0.0',
      checks: {
        database: {
          status: 'connected',
          responseTime: dbResponseTime,
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    const unhealthyStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'product-service',
      version: '1.0.0',
      error: error.message,
      uptime: process.uptime(),
    };

    res.status(503).json(unhealthyStatus);
  }
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req, res) => {
  try {
    await Promise.all([
      dynamodb.describeTable({
        TableName: PRODUCT_TABLE,
      }).promise(),

      dynamodb.describeTable({
        TableName: CATEGORY_TABLE,
      }).promise(),
    ]);

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Readiness check failed:', error);

    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});
/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *       503:
 *         description: Service is not alive
 */
router.get('/live', (req, res) => {
  // Simple liveness check - just check if process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /health/info:
 *   get:
 *     summary: Get service deployment info including GUID
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                   example: product-service
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 deploymentGuid:
 *                   type: string
 *                   description: Unique deployment GUID from CI/CD
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    service: 'product-service',
    version: '1.0.0',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

