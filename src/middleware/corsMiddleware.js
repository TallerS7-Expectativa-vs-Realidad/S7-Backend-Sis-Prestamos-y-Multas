const cors = require('cors');

/**
 * CORS middleware configuration
 * Allows requests from frontend (port 8080) and localhost variants
 */
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'http://frontend:80',
  ],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
