import pool from '../db/connection.js';

const otpRepository = {
  async create(userId, code, expiresAt) {
    const { rows } = await pool.query(
      'INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, code, expiresAt]
    );
    return rows[0];
  },

  async findValidByCode(code) {
    const { rows } = await pool.query(
      'SELECT * FROM otps WHERE code = $1 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [code]
    );
    return rows[0] || null;
  },

  async markUsed(id) {
    await pool.query('UPDATE otps SET used = TRUE WHERE id = $1', [id]);
  },

  async deleteExpired() {
    await pool.query('DELETE FROM otps WHERE expires_at < NOW() OR used = TRUE');
  },
};

export default otpRepository;
