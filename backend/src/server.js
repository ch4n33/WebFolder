import app from './app.js';
import config from './config/index.js';
import sessionRepository from './repositories/session.repository.js';
import otpRepository from './repositories/otp.repository.js';

// Periodic cleanup of expired sessions and OTPs
setInterval(async () => {
  try {
    await sessionRepository.expireOld();
    await otpRepository.deleteExpired();
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}, 60 * 1000); // Every minute

app.listen(config.port, () => {
  console.log(`WebFolder API running on port ${config.port}`);
  console.log(`Upload page: ${config.siteUrl}/upload`);
  console.log(`Backoffice:  ${config.siteUrl}/backoffice`);
});
