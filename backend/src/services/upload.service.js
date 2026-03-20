import path from 'path';
import pool from '../db/connection.js';
import storageRepository from '../repositories/storage.repository.js';
import { ValidationError } from '../utils/errors.js';

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
]);

function sanitizeFileName(name) {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
}

const uploadService = {
  async upload(file, userId, sessionId) {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new ValidationError(`File type ${file.mimetype} not allowed`);
    }

    const safeName = sanitizeFileName(file.originalname);
    const timestamp = Date.now();
    const s3Key = `${userId}/${timestamp}_${safeName}`;

    await storageRepository.upload(s3Key, file.buffer, file.mimetype);

    const { rows } = await pool.query(
      `INSERT INTO uploads (user_id, session_id, s3_key, original_name, size_bytes, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, sessionId, s3Key, file.originalname, file.size, file.mimetype]
    );

    return rows[0];
  },
};

export default uploadService;
