import crypto from 'crypto';
import config from '../config/index.js';
import otpRepository from '../repositories/otp.repository.js';

const otpService = {
  async generate(userId) {
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + config.otp.durationMinutes * 60 * 1000);
    return otpRepository.create(userId, code, expiresAt);
  },

  async validate(code) {
    const otp = await otpRepository.findValidByCode(code);
    if (!otp) {
      return null;
    }
    await otpRepository.markUsed(otp.id);
    return otp;
  },
};

export default otpService;
