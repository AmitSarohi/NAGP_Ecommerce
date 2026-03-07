const express = require('express');
const { client, OPENSEARCH_INDEX } = require('../config/opensearch');

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
 *                   example: search-service
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 checks:
 *                   type: object
 *                   properties:
 *                     opensearch:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                         clusterHealth:
 *                           type: string
 *                           description: OpenSearch cluster health status
 *                         responseTime:
 *                           type: number
 *                           description: Response time in milliseconds
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check OpenSearch connectivity and cluster health
    const osStartTime = Date.now();
    
    const healthResponse = await client.cluster.health({});
    const indexExists = await client.indices.exists({
      index: OPENSEARCH_INDEX,
    });
    
    const osResponseTime = Date.now() - osStartTime;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'search-service',
      version: '1.0.0',
      checks: {
        opensearch: {
          status: 'connected',
          clusterHealth: healthResponse.body.status,
          indexExists: indexExists.body,
          responseTime: osResponseTime,
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
      service: 'search-service',
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
    // Check if OpenSearch cluster is ready and index exists
    const [healthResponse, indexExists] = await Promise.all([
      client.cluster.health({}),
      client.indices.exists({ index: OPENSEARCH_INDEX }),
    ]);

    const isReady = healthResponse.body.status !== 'red' && indexExists.body;

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        clusterHealth: healthResponse.body.status,
        indexExists: indexExists.body,
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        clusterHealth: healthResponse.body.status,
        indexExists: indexExists.body,
      });
    }
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

module.exports = router;
