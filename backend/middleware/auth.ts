import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'devSecret';

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader =
    (req.headers && (req.headers as any).authorization) || (req.get && req.get('authorization'));
  const headerToken =
    authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;
  const token = headerToken || req.cookies?.accessToken;
  console.debug(
    '[auth middleware] headerToken:',
    !!headerToken,
    'cookieToken:',
    !!req.cookies?.accessToken,
  );
  if (!token) {
    console.debug('[auth middleware] no token provided');
    return res.status(401).json({ message: 'No access token' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e: any) {
    console.debug('[auth middleware] token verify error:', e && e.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};
