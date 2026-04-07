const express = require('express');
const AWS = require('aws-sdk');
const { USER_TABLE } = require('../config/database');

const router = express.Router();
const dynamodb = new AWS.DynamoDB();

/* =========================
   BASIC HEALTH CHECK
========================= */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    /* =========================
       DB CHECK
    ========================= */
    const dbStart = Date.now();

    await dynamodb
      .describeTable({ TableName: USER_TABLE })
      .promise();

    const dbResponseTime = Date.now() - dbStart;

    /* =========================
       RESPONSE
    ========================= */
    res.status(200).json({
      status: 'healthy',
      service: 'user-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),

      checks: {
        database: {
          status: 'connected',
          responseTime: dbResponseTime,
        },
      },

      system: {
        memory: {
          rss: process.memoryUsage().rss,
          heapUsed: process.memoryUsage().heapUsed,
        },
      },
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);

    res.status(503).json({
      status: 'unhealthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/* =========================
   READINESS CHECK
========================= */
router.get('/ready', async (req, res) => {
  try {
    await dynamodb
      .describeTable({ TableName: USER_TABLE })
      .promise();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Readiness failed:', error);

    res.status(503).json({
      status: 'not_ready',
      error: error.message,
    });
  }
});

/* =========================
   LIVENESS CHECK
========================= */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* =========================
   DEPLOYMENT INFO
========================= */
router.get('/info', (req, res) => {
  res.status(200).json({
    service: 'user-service',
    version: '1.0.0',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;