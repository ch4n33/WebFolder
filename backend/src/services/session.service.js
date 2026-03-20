import crypto from 'crypto';
import config from '../config/index.js';
import sessionRepository from '../repositories/session.repository.js';
import otpService from './otp.service.js';
import { AppError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sessionExpiresAt() {
  return new Date(Date.now() + config.session.durationMinutes * 60 * 1000);
}

const sessionService = {
  // QR Flow: 공유 PC가 세션을 초기화
  async initSession() {
    const sessionSig = crypto.randomUUID();
    // pending 상태로 생성, 초기 만료는 5분 (활성화 대기용)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const session = await sessionRepository.create(sessionSig, expiresAt);
    const qrUrl = `${config.siteUrl}/api/session/activate?sig=${sessionSig}`;
    return { sessionSig: session.session_sig, qrUrl };
  },

  // QR Flow: 개인 디바이스가 세션을 활성화
  async activateByJwt(sig, userId) {
    const session = await sessionRepository.findBySig(sig);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    if (session.status !== 'pending') {
      throw new AppError('Session already used or expired', 400);
    }
    if (new Date(session.expires_at) < new Date()) {
      throw new AppError('Session expired', 400);
    }
    const token = generateToken();
    const expiresAt = sessionExpiresAt();
    return sessionRepository.activate(session.id, userId, token, expiresAt);
  },

  // OTP Flow: 공유 PC가 OTP를 제출하여 세션 생성+활성화
  async activateByOtp(otpCode) {
    const otp = await otpService.validate(otpCode);
    if (!otp) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }
    const sessionSig = crypto.randomUUID();
    const expiresAt = sessionExpiresAt();
    const session = await sessionRepository.create(sessionSig, expiresAt);
    const token = generateToken();
    const activated = await sessionRepository.activate(session.id, otp.user_id, token, expiresAt);
    return { sessionToken: activated.token, expiresAt: activated.expires_at };
  },

  // 공유 PC가 세션 활성화 여부를 폴링
  async pollSession(sig) {
    const session = await sessionRepository.findBySig(sig);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    if (session.status === 'active' && new Date(session.expires_at) >= new Date()) {
      return { active: true, sessionToken: session.token, expiresAt: session.expires_at };
    }
    return { active: false };
  },
};

export default sessionService;
