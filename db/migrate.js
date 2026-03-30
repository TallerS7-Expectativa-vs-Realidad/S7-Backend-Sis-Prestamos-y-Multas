const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Lee schema.sql (archivo maestro único)
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('✓ Database migration completed successfully');
    console.log('✓ Tables created: loan_books, debt_reader');
    console.log('✓ Indexes created for optimized queries');
    process.exit(0);
  } catch (err) {
    console.error('✗ Database migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
