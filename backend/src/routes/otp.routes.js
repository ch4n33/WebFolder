import { Router } from 'express';
import otpService from '../services/otp.service.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Backoffice: JWT가 있는 개인 디바이스에서 OTP 생성
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const otp = await otpService.generate(req.user.id);
    res.json({ code: otp.code, expiresAt: otp.expires_at });
  } catch (err) {
    next(err);
  }
});

export default router;
