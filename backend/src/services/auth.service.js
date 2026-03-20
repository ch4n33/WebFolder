import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import userRepository from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';

const authService = {
  async register(email, password) {
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
