-- ============================================================================
-- SCHEMA MAESTRO - Sistema de Préstamos y Multas
-- ============================================================================
-- Archivo único para estructura de base de datos.
-- Se usa en DOS contextos:
--   1. NPM local: npm run migrate (lee este archivo)
--   2. Docker: Montado en /docker-entrypoint-initdb.d/schema.sql
--
-- NO DUPLICAR EN OTROS ARCHIVOS. Este es el único archivo maestro.
-- ============================================================================

-- Create loan_books table
CREATE TABLE IF NOT EXISTS loan_books (
  loan_id SERIAL PRIMARY KEY,
  id_book VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  type_id_reader VARCHAR(50) NOT NULL,
  id_reader VARCHAR(255) NOT NULL,
  name_reader VARCHAR(255) NOT NULL,
  loan_days INTEGER NOT NULL CHECK (loan_days IN (7, 14, 21)),
  state VARCHAR(50) NOT NULL DEFAULT 'ON_LOAN' CHECK (state IN ('ON_LOAN', 'RETURNED')),
  date_limit TIMESTAMP NOT NULL,
  date_return TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create debt_reader table for debt tracking
CREATE TABLE IF NOT EXISTS debt_reader (
  id_debt SERIAL PRIMARY KEY,
  loan_id INTEGER REFERENCES loan_books(loan_id),
  type_id_reader VARCHAR(50) NOT NULL,
  id_reader VARCHAR(255) NOT NULL,
  name_reader VARCHAR(255) NOT NULL,
  units_fib INTEGER DEFAULT 0,
  amount_debt NUMERIC(10, 2) DEFAULT 0,
  state_debt VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (state_debt IN ('PENDING', 'PAID')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_loan_books_id_book ON loan_books(id_book);
CREATE INDEX IF NOT EXISTS idx_loan_books_id_reader ON loan_books(id_reader);
CREATE INDEX IF NOT EXISTS idx_loan_books_state ON loan_books(state);
CREATE INDEX IF NOT EXISTS idx_debt_reader_id_reader ON debt_reader(id_reader);
CREATE INDEX IF NOT EXISTS idx_debt_reader_state_debt ON debt_reader(state_debt);
