import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const files = ['001_initial.sql', '002_whitelist.sql'];
  try {
    for (const file of files) {
      const sql = readFileSync(join(__dirname, 'migrations', file), 'utf-8');
      await pool.query(sql);
      console.log(`Migration ${file} completed.`);
    }
    console.log('All migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
