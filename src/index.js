require('dotenv').config();
const { Pool } = require('pg');
const makeApp = require('./app');
const { initializeDatabase, retryWithBackoff } = require('./db/initialize');

// ============================================================
// DATABASE POOL INITIALIZATION
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Flag para rastrear si la BD está lista
let dbReady = false;
const dbStatus = { ready: false };

// Handle pool errors - log pero no crashear el servidor
pool.on('error', (err) => {
  console.error('[DB] ✗ Error en conexión idle:', err.message);
});

// ============================================================
// DATABASE INITIALIZATION (NO-BLOQUEANTE)
// ============================================================
async function initializeDatabaseInBackground() {
  try {
    await retryWithBackoff(() => initializeDatabase(pool));
    dbReady = true;
    dbStatus.ready = true;
    console.log('[DB] ✓ Base de datos lista para recibir requests');
  } catch (error) {
    // Esto nunca debería pasar porque retryWithBackoff es indefinido
    console.error('[DB] ✗ Error crítico en background:', error.message);
  }
}

// ============================================================
// APP INITIALIZATION & SERVER STARTUP
// ============================================================
async function startServer() {
  try {
    // Crear app con pool (pero BD aún no está lista)
    const app = makeApp(pool, dbStatus);
    const PORT = process.env.PORT || 3000;

    // ============================================================
    // INICIAR SERVIDOR INMEDIATAMENTE (NO-BLOQUEANTE)
    // ============================================================
    app.listen(PORT, () => {
      console.log(`[SERVER] ✓ Escuchando en puerto ${PORT}`);
      console.log(`[SERVER]   Database URL: ${process.env.DATABASE_URL}`);
      console.log(`[SERVER]   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[SERVER]   ⏳ Conectando a base de datos en background...`);
    });

    // ============================================================
    // CONECTAR A BD EN PARALELO (NO-BLOQUEANTE)
    // ============================================================
    initializeDatabaseInBackground();
  } catch (error) {
    console.error('[SERVER] ✗ Error crítico inicializando servidor:', error.message);
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
