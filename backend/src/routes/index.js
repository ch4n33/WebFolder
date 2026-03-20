import { Router } from 'express';
import authRoutes from './auth.routes.js';
import otpRoutes from './otp.routes.js';
import sessionRoutes from './session.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);
router.use('/session', sessionRoutes);
router.use('/upload', uploadRoutes);

export default router;
