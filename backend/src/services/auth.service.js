import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import userRepository from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { AppError, ConflictError, UnauthorizedError } from '../utils/errors.js';
import pool from '../db/connection.js';

const authService = {
  async register(email, password) {
    // 화이트리스트 확인
    const { rows } = await pool.query(
      'SELECT 1 FROM email_whitelist WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      throw new AppError('Registration is restricted to approved emails only', 403);
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }
    const hashed = await hashPassword(password);
    return userRepository.create(email, hashed);
  },

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    return { user: { id: user.id, email: user.email }, token };
  },
};

export default authService;
