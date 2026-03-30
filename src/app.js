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
 * Takes a database pool as parameter for dependency injection
 */
module.exports = function makeApp(pool) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(corsMiddleware);
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

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
  app.use('/api/v1/debt', debtRouter);
  app.use('/api/v1/debts', debtRouter);
  app.use('/api/v1/loan', loanRouter);
  app.use('/api/v1/loans', loanRouter);
  app.use('/api/v1/readers', readersRouter);

  // ============================================================
  // ERROR HANDLING MIDDLEWARE
  // ============================================================
  // Must be registered AFTER all routes
  app.use(errorHandler);

  return app;
};
