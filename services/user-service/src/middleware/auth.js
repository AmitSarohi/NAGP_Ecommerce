const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/* =========================
   Helper: Extract Token
========================= */
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

/* =========================
   REQUIRED AUTH
========================= */
const authMiddleware = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        error: { message: 'No token provided' },
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: { message: 'Invalid token' },
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token expired' },
      });
    }

    console.error('Auth Middleware Error:', error);

    return res.status(500).json({
      error: { message: 'Authentication error' },
    });
  }
};

/* =========================
   OPTIONAL AUTH
========================= */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch {
    // Ignore errors → continue
    next();
  }
};

/* =========================
   ADMIN CHECK
========================= */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required' },
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: { message: 'Admin access required' },
    });
  }

  next();
};

/* =========================
   EXPORTS
========================= */
module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
};