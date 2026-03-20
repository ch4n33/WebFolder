import pg from 'pg';
import config from '../config/index.js';

const pool = new pg.Pool({
  connectionString: config.database.url,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

export default pool;
