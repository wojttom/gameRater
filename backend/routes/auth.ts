import * as express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import joi from 'joi';
import { Request } from 'express';

const router = express.Router();
interface AuthRequest extends Request {
  user?: any;
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'devSecret';
const REFRESH_SECRET: string = process.env.REFRESH_SECRET ?? 'devRefresh';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
});

const registerSchema = joi.object({
  email: joi.string().email().max(254).required(),
  username: joi.string().regex(/^[a-zA-Z0-9._-]{3,30}$/).required(),
  password: joi.string().min(8).max(128).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]}:;"'<>,.?/\\|`~]).*$/).required(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

router.get('/test-db', async (_req, res) => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 1) {
      return res.json({ connected: true, state });
    }
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gameRater');
    return res.json({ connected: true, state: mongoose.connection.readyState });
  } catch (err) {
    return res.status(500).json({ connected: false });
  }
});

router.post('/register', async (req: express.Request, res: express.Response) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, username, password } = req.body ?? {};

    const emailS = String(email ?? '')
      .trim()
      .toLowerCase();
    const usernameS = String(username ?? '').trim();
    const passwordS = String(password ?? '');
    if (!emailS || !usernameS || !passwordS) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailS) || emailS.length > 254) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const usernameRe = /^[a-zA-Z0-9._-]{3,30}$/;
    if (!usernameRe.test(usernameS)) {
      return res.status(400).json({ message: 'Invalid username format' });
    }

    if (passwordS.length < 8 || passwordS.length > 128) {
      return res.status(400).json({ message: 'Password must be 8-128 characters long' });
    }
    if (/[\x00-\x1F\x7F]/.test(passwordS)) {
      return res.status(400).json({ message: 'Password contains invalid control characters' });
    }
    const hasUpper = /[A-Z]/.test(passwordS);
    const hasNumber = /\d/.test(passwordS);
    const hasSpecial = /[!@#$%^&*()_\-+=\[{\]}:;"'<>,.?/\\|`~]/.test(passwordS);
    if (!hasUpper || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message:
          'Password must include at least one uppercase letter, one number and one special character',
      });
    }

    const existing = await User.findOne({
      $or: [{ email: emailS }, { username: usernameS }],
    }).lean();
    if (existing) {
      if (existing.email === emailS) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashed = await bcrypt.hash(passwordS, 10);
    const user = new User({
      email: emailS,
      username: usernameS,
      password: hashed,
    });
    await user.save();
    return res.status(201).json({ message: 'User registered' });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.debug('[auth login] created tokens; returning accessToken in body');

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl || null,
        emailPublic: !!user.emailPublic,
      },
      accessToken,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refresh', (req, res) => {
  try {
    const token = (req as AuthRequest).cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    const payload: any = jwt.verify(token, REFRESH_SECRET);
    const newAccess = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: '15m' });

    res.cookie('accessToken', newAccess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    console.debug('[auth refresh] new access token created; returning in body');

    return res.json({ accessToken: newAccess, message: 'Token refreshed' });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.json({ message: 'Logged out' });
});

export default router;
