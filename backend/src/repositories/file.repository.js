import pool from '../db/connection.js';

const fileRepository = {
  async findByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT id, original_name, size_bytes, mime_type, created_at
       FROM uploads WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findByIdAndUserId(id, userId) {
    const { rows } = await pool.query(
      `SELECT id, s3_key, original_name, size_bytes, mime_type, created_at
       FROM uploads WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  },
};

export default fileRepository;
