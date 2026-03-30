# Backend API - Sistema de Préstamos y Multas

## Overview

Backend API for the library loan and fine management system. Built with Node.js, Express, and PostgreSQL.

## Architecture

```
controllers/routes → services → repositories → database
```

### Directory Structure

```
backend/
├── src/
│   ├── app.js                 # Express app factory
│   ├── index.js              # Entry point
│   ├── models/               # DTOs and validation schemas (Zod)
│   │   ├── loan.js
│   │   └── debt.js
│   ├── repositories/         # Database access layer
│   │   ├── LoanRepository.js
│   │   └── DebtRepository.js
│   ├── services/             # Business logic layer
│   │   ├── LoanService.js
│   │   └── DebtService.js
│   ├── routes/               # HTTP routes (dependency injection)
│   │   ├── loanRoutes.js
│   │   └── debtRoutes.js
│   └── middleware/           # Express middleware
│       ├── errorHandler.js
│       └── requestLogger.js
├── db/
│   ├── schema.sql           # Estructura de BD (leído por backend al iniciar)
│   ├── initialize.js        # Inicializador: crea tablas si no existen
│   └── migrate.js           # Script para ejecutar schema.sql (dev local)
├── package.json
├── Dockerfile
├── .env.example
└── .env                      # Local development config
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and update values if needed:

```bash
cp .env.example .env
```

### 3. Database Setup

#### Auto-inicialización en el Backend

El backend ejecuta automáticamente al iniciar:
1. **Verifica** si existen las tablas
2. **Si NO existen**: Lee `schema.sql` y las crea
3. **Si YA existen**: Sigue adelante (idempotente)

```bash
# Con Docker - Las tablas se crean automáticamente
docker compose up --build
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### Loans

- `POST /api/v1/loans` - Register a new book loan
  - Body: `{ id_book, title, type_id_reader, id_reader, name_reader, loan_days }`
  - Returns: 201 (success), 400 (invalid), 409 (conflict)

- `GET /api/v1/loans/{name}` - Check book availability (HU-01)

- `PATCH /api/v1/loans` - Register book return (HU-03 / HU-04)
  - Body: `{ date_return, type_id_reader, id_book?, id_reader?, name_reader?, base_fib_amount? }`
  - Returns: 200 (success), 400 (invalid), 404 (loan not found), 409 (already returned)

- Compatibility aliases currently exposed: `POST|GET|PATCH /api/v1/loan...`

### Debts

- `GET /api/v1/debts/:id_reader` - Get pending debts for a reader
  - Returns the pending debt records for the supplied reader id

- Compatibility alias currently exposed: `GET /api/v1/debt/:id_reader`

- `PATCH /api/v1/debts/{id_debt}` - Planned for HU-06 debt payment flow, not implemented yet

## Business Rules

**HU-02: Register Book Loan**

- `loan_days` must be 7, 14, or 21 days
- Book must be available (no active loans)
- Reader must have no pending debts
- Calculates `date_limit = today + loan_days`

### Response Codes

- `201` - Loan created successfully
- `400` - Invalid payload or invalid loan days (INVALID_PAYLOAD, INVALID_LOAN_DAYS)
- `409` - Conflict: book not available or reader has debt (BOOK_NOT_AVAILABLE, READER_HAS_DEBT)
- `500` - Internal server error

## Development Patterns

### Dependency Injection

Services are injected into route factories:

```javascript
const loanService = new LoanService(loanRepository, debtRepository);
const loanRouter = makeLoanRouter({ loanService });
app.use('/api/v1/loans', loanRouter);
```

### Error Handling

Errors are thrown with custom codes and status codes:

```javascript
const error = new Error('Book is not available');
error.code = 'BOOK_NOT_AVAILABLE';
error.statusCode = 409;
throw error;
```

### Database Operations

All DB operations are async and wrapped in repositories:

```javascript
async insertLoan(loanData) {
  const result = await this.pool.query(query, values);
  return result.rows[0];
}
```

## Testing

Tests are handled by a dedicated Test Engineer (see project specs).

## Database Schema

### loan_books Table

```sql
CREATE TABLE loan_books (
  loan_id SERIAL PRIMARY KEY,
  id_book VARCHAR(255),
  title VARCHAR(500),
  type_id_reader VARCHAR(50),
  id_reader VARCHAR(255),
  name_reader VARCHAR(255),
  loan_days INTEGER CHECK (loan_days IN (7, 14, 21)),
  state VARCHAR(50) CHECK (state IN ('ON_LOAN', 'RETURNED')),
  date_limit TIMESTAMP,
  date_return TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### debt_reader Table

```sql
CREATE TABLE debt_reader (
  id_debt SERIAL PRIMARY KEY,
  loan_id INTEGER REFERENCES loan_books(loan_id),
  type_id_reader VARCHAR(50),
  id_reader VARCHAR(255),
  name_reader VARCHAR(255),
  units_fib INTEGER,
  amount_debt NUMERIC(10, 2),
  state_debt VARCHAR(50) CHECK (state_debt IN ('PENDING', 'PAID')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Docker Deployment

Build the backend image:

```bash
docker compose build backend
```

Run with docker compose:

```bash
docker compose up
```

The API will be available at `http://localhost:3000`

## Related Specifications

- [HU-01: Query Book Availability](../.github/specs/hu-01-consultar-estado-disponibilidad-libro.spec.md)
- [HU-02: Register Loan (this feature)](../.github/specs/hu-02-registrar-prestamo-libro.spec.md)
- [HU-03: Register On-time Return](../.github/specs/hu-03-registrar-devolucion-en-plazo.spec.md)
- [HU-04: Register Late Return](../.github/specs/hu-04-registrar-devolucion-tardia-generar-multa.spec.md)
- [HU-05: Query Overdue Loans](../.github/specs/hu-05-consultar-préstamos-vencidos-y-lector.spec.md)
- [HU-06: Register Debt Payment](../.github/specs/hu-06-registrar-pago-total-multa-rehabilitar-lector.spec.md)
