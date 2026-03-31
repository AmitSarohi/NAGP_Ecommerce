const express = require('express');
const { client, OPENSEARCH_INDEX } = require('../config/opensearch');

const router = express.Router();

/**
 * Health Check - Detailed
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
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

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'search-service',
      error: error.message,
      uptime: process.uptime(),
    });
  }
});

/**
 * ✅ FIXED Readiness Probe
 */
router.get('/ready', async (req, res) => {
  try {
    const healthResponse = await client.cluster.health({});
    const indexExists = await client.indices.exists({
      index: OPENSEARCH_INDEX,
    });

    const isClusterHealthy = healthResponse.body.status !== 'red';

    // ✅ Relaxed condition (key fix)
    if (isClusterHealthy) {
      return res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        clusterHealth: healthResponse.body.status,
        indexExists: indexExists.body, // just info, not blocking
      });
    }

    return res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      clusterHealth: healthResponse.body.status,
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
 * Liveness Probe
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Deployment Info
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    service: 'search-service',
    version: '1.0.0',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;