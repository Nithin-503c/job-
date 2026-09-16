import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verifies the Bearer token and attaches req.user (the full Mongo user doc).
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Like requireAuth, but doesn't fail the request if there's no/invalid
// token — just leaves req.user undefined. Used on public routes that show
// extra data to a logged-in user (e.g. the exact job address once assigned).
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.id);
    if (user) req.user = user;
    next();
  } catch (err) {
    next();
  }
}

// Restricts a route to one or more roles, e.g. requireRole('employer')
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Only ${roles.join('/')} can do this` });
    }
    next();
  };
}
