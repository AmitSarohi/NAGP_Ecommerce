const express = require('express');
const router = express.Router();

// HEALTH (can check DB if needed)
router.get('/', (req, res) => {
res.status(200).json({
status: 'healthy',
service: 'product-service',
timestamp: new Date().toISOString(),
});
});

// 🔥 FIXED READINESS (NO DB CALL)
router.get('/ready', (req, res) => {
res.status(200).json({
status: 'ready',
service: 'product-service',
deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
timestamp: new Date().toISOString(),
});
});

// LIVENESS
router.get('/live', (req, res) => {
res.status(200).json({
status: 'alive',
timestamp: new Date().toISOString(),
});
});

// DEPLOYMENT INFO
router.get('/info', (req, res) => {
res.status(200).json({
service: 'product-service',
deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
timestamp: new Date().toISOString(),
});
});

module.exports = router;