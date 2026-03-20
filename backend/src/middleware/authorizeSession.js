import { UnauthorizedError } from '../utils/errors.js';
import sessionRepository from '../repositories/session.repository.js';

export async function authorizeSession(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No session token'));
  }

  const token = authHeader.slice(7);
  try {
    const session = await sessionRepository.findByToken(token);
    if (!session) {
      return next(new UnauthorizedError('Invalid session token'));
    }
    if (session.status !== 'active' || new Date(session.expires_at) < new Date()) {
      return next(new UnauthorizedError('Session expired'));
    }
    req.session = session;
    req.user = { id: session.user_id };
    next();
  } catch (err) {
    next(err);
  }
}
