import path from 'path';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
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
    try {
      if (!ALLOWED_MIMES.has(file.mimetype)) {
        throw new ValidationError(`File type ${file.mimetype} not allowed`);
      }

      const safeName = sanitizeFileName(file.originalname);
      const timestamp = Date.now();
      const s3Key = `${userId}/${timestamp}_${safeName}`;

      const stream = createReadStream(file.path);
      await storageRepository.upload(s3Key, stream, file.mimetype, file.size);

      const { rows } = await pool.query(
        `INSERT INTO uploads (user_id, session_id, s3_key, original_name, size_bytes, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, sessionId, s3Key, file.originalname, file.size, file.mimetype]
      );

      return rows[0];
    } finally {
      // temp 파일 정리
      if (file.path) {
        await unlink(file.path).catch(() => {});
      }
    }
  },
};

export default uploadService;
