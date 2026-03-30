require('dotenv').config();
const { Pool } = require('pg');
const makeApp = require('./app');
const { initializeDatabase } = require('./db/initialize');

// ============================================================
// DATABASE POOL INITIALIZATION
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// ============================================================
// APP INITIALIZATION & DATABASE SETUP
// ============================================================
async function startServer() {
  try {
    // Inicializar base de datos (crear tablas si no existen)
    await initializeDatabase(pool);

    // Crear app con pool inicializado
    const app = makeApp(pool);
    const PORT = process.env.PORT || 3000;

    // ============================================================
    // SERVER STARTUP
    // ============================================================
    app.listen(PORT, () => {
      console.log(`[SERVER] ✓ Escuchando en puerto ${PORT}`);
      console.log(`[SERVER]   Database: ${process.env.DATABASE_URL}`);
      console.log(`[SERVER]   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[SERVER] ✗ Error inicializando servidor:', error);
    process.exit(1);
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
process.on('SIGTERM', async () => {
  console.log('[SERVER] SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[SERVER] SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

// Iniciar el servidor
startServer();
