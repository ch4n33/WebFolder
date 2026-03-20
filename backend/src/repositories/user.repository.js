import pool from '../db/connection.js';

const userRepository = {
  async create(email, hashedPassword) {
    const { rows } = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },
};

export default userRepository;
