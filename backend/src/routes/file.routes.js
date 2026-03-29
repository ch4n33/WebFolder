import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validateParams } from '../middleware/validate.js';
import { z } from 'zod';
import fileService from '../services/file.service.js';

const router = Router();

const fileIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid file ID').transform(Number),
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const files = await fileService.list(req.user.id);
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/download', authenticate, validateParams(fileIdSchema), async (req, res, next) => {
  try {
    const result = await fileService.getDownloadUrl(req.validatedParams.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
