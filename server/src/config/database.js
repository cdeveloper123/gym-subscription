const mysql = require('mysql2/promise');

let pool;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gym_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
};

const getConnection = async () => {
  const pool = createPool();
  return await pool.getConnection();
};

const query = async (sql, params) => {
  const pool = createPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const testConnection = async () => {
  try {
    const pool = createPool();
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

module.exports = { createPool, getConnection, query, testConnection };
