import { Router } from 'express';
import os from 'os';
import multer from 'multer';
import { authorizeSession } from '../middleware/authorizeSession.js';
import uploadService from '../services/upload.service.js';

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const router = Router();

router.post('/', authorizeSession, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const result = await uploadService.upload(req.file, req.user.id, req.session.id);
    res.json({ success: true, upload: result });
  } catch (err) {
    next(err);
  }
});

export default router;
