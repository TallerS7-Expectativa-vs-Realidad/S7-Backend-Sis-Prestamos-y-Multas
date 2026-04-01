const cors = require('cors');

/**
 * CORS middleware configuration
 * Allows requests from frontend (port 8080) and localhost variants
 */
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite dev server (local)
    'http://localhost:8080',  // Frontend (Docker)
    'http://localhost:3000',  // Backend (local)
    'http://127.0.0.1:5173',  // Vite dev server (127.0.0.1)
    'http://127.0.0.1:8080',  // Frontend (127.0.0.1)
    'http://127.0.0.1:3000',  // Backend (127.0.0.1)
    'http://frontend:80',     // Frontend (Docker)
  ],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
