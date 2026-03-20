import pool from '../db/connection.js';

const sessionRepository = {
  async create(sessionSig, expiresAt) {
    const { rows } = await pool.query(
      'INSERT INTO upload_sessions (session_sig, expires_at) VALUES ($1, $2) RETURNING *',
      [sessionSig, expiresAt]
    );
    return rows[0];
  },

  async findBySig(sig) {
    const { rows } = await pool.query(
      'SELECT * FROM upload_sessions WHERE session_sig = $1',
      [sig]
    );
    return rows[0] || null;
  },

  async findByToken(token) {
    const { rows } = await pool.query(
      'SELECT * FROM upload_sessions WHERE token = $1',
      [token]
    );
    return rows[0] || null;
  },

  async activate(id, userId, token, expiresAt) {
    const { rows } = await pool.query(
      `UPDATE upload_sessions
       SET user_id = $1, token = $2, status = 'active', expires_at = $3
       WHERE id = $4 RETURNING *`,
      [userId, token, expiresAt, id]
    );
    return rows[0];
  },

  async expireOld() {
    await pool.query(
      `UPDATE upload_sessions SET status = 'expired'
       WHERE status IN ('pending', 'active') AND expires_at < NOW()`
    );
  },
};

export default sessionRepository;
