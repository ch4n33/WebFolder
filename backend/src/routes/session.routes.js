import { Router } from 'express';
import sessionService from '../services/session.service.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { otpSubmitSchema } from '../schemas/otp.schema.js';
import { sessionSigSchema } from '../schemas/session.schema.js';

const router = Router();

// 공유 PC: 세션 초기화 (QR Flow)
router.post('/init', async (_req, res, next) => {
  try {
    const result = await sessionService.initSession();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 공유 PC: OTP 제출로 세션 활성화 (OTP Flow)
router.post('/otp', validate(otpSubmitSchema), async (req, res, next) => {
  try {
    const { otp } = req.validated;
    const result = await sessionService.activateByOtp(otp);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 개인 디바이스: QR 스캔으로 세션 활성화 (QR Flow)
router.get('/activate', authenticate, validateQuery(sessionSigSchema), async (req, res, next) => {
  try {
    const { sig } = req.validatedQuery;
    await sessionService.activateByJwt(sig, req.user.id);
    res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>WebFolder</title>
      <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;font-family:system-ui;background:#f0fdf4;}
      .card{text-align:center;padding:2rem;border-radius:1rem;background:white;box-shadow:0 4px 12px rgba(0,0,0,0.1);}
      h1{color:#16a34a;font-size:1.5rem;margin:0 0 0.5rem;}p{color:#666;margin:0;}</style>
      </head><body><div class="card"><h1>Session Activated</h1><p>You can now upload files on the shared device.</p><p>This window can be closed.</p></div></body></html>
    `);
  } catch (err) {
    next(err);
  }
});

// 공유 PC: 세션 활성화 여부 폴링 (QR Flow)
router.get('/poll', validateQuery(sessionSigSchema), async (req, res, next) => {
  try {
    const { sig } = req.validatedQuery;
    const result = await sessionService.pollSession(sig);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
