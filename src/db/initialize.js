const fs = require('fs');
const path = require('path');

async function tableExists(pool, tableName) {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS exists;
    `,
    [tableName]
  );

  return result.rows[0].exists;
}

async function columnExists(pool, tableName, columnName) {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
      ) AS exists;
    `,
    [tableName, columnName]
  );

  return result.rows[0].exists;
}

async function migrateLegacyDebtSchema(pool) {
  const hasCanonicalTable = await tableExists(pool, 'debt_reader');
  const hasLegacyTable = await tableExists(pool, 'dept_reader');

  if (hasCanonicalTable || !hasLegacyTable) {
    return false;
  }

  console.log('[DB] Migrando tabla legacy dept_reader -> debt_reader...');

  await pool.query('ALTER TABLE dept_reader RENAME TO debt_reader;');

  if (await columnExists(pool, 'debt_reader', 'dept_id')) {
    await pool.query('ALTER TABLE debt_reader RENAME COLUMN dept_id TO id_debt;');
  }

  if (await columnExists(pool, 'debt_reader', 'amount_dept')) {
    await pool.query('ALTER TABLE debt_reader RENAME COLUMN amount_dept TO amount_debt;');
  }

  if (await columnExists(pool, 'debt_reader', 'state_dept')) {
    await pool.query('ALTER TABLE debt_reader RENAME COLUMN state_dept TO state_debt;');
  }

  if (!(await columnExists(pool, 'debt_reader', 'units_fib'))) {
    await pool.query('ALTER TABLE debt_reader ADD COLUMN units_fib INTEGER DEFAULT 0;');
  }

  return true;
}

async function ensureSchema(pool) {
  const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await pool.query(schema);
}

/**
 * Database Initialization Module
 * Ejecuta el schema al conectarse si las tablas no existen
 * - Si las tablas ya existen, no hace nada (idempotente)
 * - Si no existen, las crea
 */

async function initializeDatabase(pool) {
  try {
    console.log('[DB] Verificando si las tablas existen...');

    const migratedLegacyDebt = await migrateLegacyDebtSchema(pool);
    const hasLoanBooks = await tableExists(pool, 'loan_books');
    const hasDebtReader = await tableExists(pool, 'debt_reader');

    if (!hasLoanBooks || !hasDebtReader) {
      console.log('[DB] Tablas faltantes detectadas. Ejecutando schema...');
      await ensureSchema(pool);
      console.log('[DB] ✓ Schema ejecutado correctamente');
    } else if (migratedLegacyDebt) {
      await ensureSchema(pool);
      console.log('[DB] ✓ Migración legacy aplicada y schema reconciliado');
    } else {
      console.log('[DB] ✓ Tablas requeridas ya existen. Salteando inicialización.');
    }

    console.log('[DB] ✓ Tablas disponibles: loan_books, debt_reader');
    console.log('[DB] ✓ Índices creados o verificados para optimizar consultas');

    return true;
  } catch (error) {
    console.error('[DB] ✗ Error inicializando base de datos:', error.message);
    throw error;
  }
}

module.exports = { initializeDatabase };
