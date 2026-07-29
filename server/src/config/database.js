const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/gym_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected successfully:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    return false;
  }
};

module.exports = {
  query,
  pool,
  testConnection
};
