const express = require('express');
const corsMiddleware = require('./middleware/corsMiddleware');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const DebtRepository = require('./repositories/debtRepository');
const DebtService = require('./services/DebtService');
const LoanRepository = require('./repositories/loanRepository');
const LoanService = require('./services/loanService');
const makeDebtRouter = require('./routes/debtRoutes');
const makeLoanRouter = require('./routes/loanRoutes');
const makeReadersRouter = require('./routes/readersRoutes');

/**
 * Factory function to create and configure the Express app
 * Takes a database pool and dbStatus as parameters for dependency injection
 */
module.exports = function makeApp(pool, dbStatus = { ready: false }) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(corsMiddleware);
  app.use(requestLogger);

  // ============================================================
  // HEALTH CHECK ENDPOINTS
  // ============================================================
  
  // Liveness probe: servidor está vivo
  app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  // Readiness probe: servidor está listo para procesar requests
  app.get('/health/ready', (req, res) => {
    if (dbStatus.ready) {
      res.status(200).json({ status: 'ready', database: 'connected' });
    } else {
      res.status(503).json({ status: 'not-ready', database: 'connecting...' });
    }
  });

  // Legacy health endpoint (compatible con código anterior)
  app.get('/health', (req, res) => {
    const response = {
      status: dbStatus.ready ? 'ok' : 'initializing',
      message: dbStatus.ready ? 'Server is ready' : 'Server is connecting to database',
      database: dbStatus.ready ? 'connected' : 'connecting...'
    };
    const statusCode = dbStatus.ready ? 200 : 503;
    res.status(statusCode).json(response);
  });

  // ============================================================
  // MIDDLEWARE: Verificar disponibilidad de BD para rutas con datos
  // ============================================================
  const requireDatabase = (req, res, next) => {
    if (!dbStatus.ready) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database is still connecting. Please try again in a few moments.'
      });
    }
    next();
  };

  // ============================================================
  // DEPENDENCY INJECTION SETUP
  // ============================================================
  // This section instantiates all repositories, services, and routers
  // in the correct order and injects them as dependencies

  // Repositories (depend on database pool)
  const debtRepository = new DebtRepository(pool);
  const loanRepository = new LoanRepository(pool);

  // Services (depend on repositories)
  const debtService = new DebtService(debtRepository);
  const loanService = new LoanService(loanRepository, debtService);

  // Routers (depend on services)
  const debtRouter = makeDebtRouter({ debtService });
  const loanRouter = makeLoanRouter({ loanService });
  const readersRouter = makeReadersRouter({ debtService });
  

  // ============================================================
  // ROUTE REGISTRATION
  // ============================================================
  // Aplicar middleware requireDatabase a todas las rutas que usan BD
  app.use('/api/v1/debt', requireDatabase, debtRouter);
  app.use('/api/v1/debts', requireDatabase, debtRouter);
  app.use('/api/v1/loan', requireDatabase, loanRouter);
  app.use('/api/v1/loans', requireDatabase, loanRouter);
  app.use('/api/v1/readers', requireDatabase, readersRouter);

  // ============================================================
  // ERROR HANDLING MIDDLEWARE
  // ============================================================
  // Must be registered AFTER all routes
  app.use(errorHandler);

  return app;
};
