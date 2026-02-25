import * as express from 'express';
import User from '../models/user';
import Review from '../models/review';
import bcrypt from 'bcrypt';
import * as authMiddleware from '../middleware/auth';
import xss from 'xss';

const router = express.Router();

router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate('addedGames');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/user/:username', authMiddleware.auth, async (req: any, res) => {
  try {
    const { email, password, avatar, bio } = req.body;
    const update: any = {};

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // only allow self-update
    if (req.user?.id !== user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    if (email) {
      const existingUser = await User.findOne({
        email: email,
        username: { $ne: req.params.username },
      });
      if (existingUser) {
        return res.status(400).json({ error: 'This email address is already in use' });
      }
      update.email = email;
    }
    if (avatar) update.avatarUrl = avatar;
    if (bio !== undefined) update.bio = bio;
    if (typeof req.body.emailPublic !== 'undefined') update.emailPublic = !!req.body.emailPublic;
    if (password) update.password = await bcrypt.hash(password, 10);

    if (Object.keys(update).length === 0) {
      const { password: pw, ...userData } = user.toObject();
      return res.json(userData);
    }

    const updated = await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: update },
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { password: pw, ...userData } = updated.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/user/:username/favorites/:gameId', authMiddleware.auth, async (req: any, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // only allow self-favorite modifications
    if (req.user?.id !== user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    const gameId = req.params.gameId;
    const { gameName, isCustom } = req.body;

    const exists = user.favorites.some((fav: any) => String(fav.appid) === String(gameId));
    if (exists) {
      const { password: pw, ...userData } = user.toObject();
      return res.json(userData);
    }

    if (isCustom) {
      const CustomGame = require('../models/customGame').default;
      const customGame = await CustomGame.findOne({ appid: gameId });

      if (customGame) {
        user.favorites.push({
          appid: customGame.appid,
          name: customGame.name,
          header_image: customGame.header_image,
          capsule_image: customGame.capsule_image,
        } as any);
      } else {
        user.favorites.push({
          appid: gameId,
          name: gameName || `Custom Game ${gameId}`,
        } as any);
      }
    } else {
      user.favorites.push({
        appid: parseInt(gameId),
        name: gameName || `Game ${gameId}`,
      } as any);
    }

    await user.save();
    const { password: pw, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/user/:username/favorites/:gameId', authMiddleware.auth, async (req: any, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // only allow self-favorite modifications
    if (req.user?.id !== user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    const gameId = req.params.gameId;

    user.favorites = user.favorites.filter((fav: any) => String(fav.appid) !== String(gameId));
    await user.save();

    const { password: pw, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/user/:username/reviews', authMiddleware.auth, async (req: any, res) => {
  try {
    const { gameAppId, gameName, rating, text } = req.body;

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // only allow self to post/update their reviews
    if (req.user?.id !== user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    const existingReview = await Review.findOne({
      userId: user._id,
      gameAppId: gameAppId,
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.text = xss(text);
      existingReview.updatedAt = new Date();
      await existingReview.save();
    } else {
      const review = new Review({
        userId: user._id,
        gameAppId,
        gameName: xss(gameName),
        rating,
        text: xss(text),
      });
      await review.save();
    }

    const updatedUser = await User.findOne({ username: req.params.username });
    const { password: pw, ...userData } = updatedUser!.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/reviews/game/:appid', async (req, res) => {
  try {
    const appid = parseInt(req.params.appid);
    const reviews = await Review.find({ gameAppId: appid }).populate(
      'userId',
      'username avatarUrl',
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:username/reviews/:appid', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const appid = parseInt(req.params.appid);
    const review = await Review.findOne({
      userId: user._id,
      gameAppId: appid,
    });

    res.json(review || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:username/reviews', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const reviews = await Review.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/reviews/:reviewId', authMiddleware.auth, async (req: any, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    if (review.userId.toString() !== req.user?.id)
      return res.status(403).json({ error: 'Not authorized' });

    await Review.deleteOne({ _id: req.params.reviewId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Anonymize (soft-delete) user: set display to "archived_account" and make profile unsearchable
router.delete('/user/:username', authMiddleware.auth, async (req: any, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // only allow self-delete for now
    if (req.user?.id !== user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    // Find the next available suffix (000000 to 999999)
    const existingArchived = await User.find({
      username: { $regex: /^archived_account\d{6}$/ },
    }).select('username');
    const usedSuffixes = existingArchived
      .map((u) => parseInt(u.username.slice(16)))
      .sort((a, b) => a - b);
    let nextSuffix = 0;
    for (let i = 0; i <= 999999; i++) {
      if (!usedSuffixes.includes(i)) {
        nextSuffix = i;
        break;
      }
    }
    const suffix = nextSuffix.toString().padStart(6, '0');

    user.username = 'archived_account' + suffix;
    user.email = 'deleted' + suffix + '@example.com';
    user.avatarUrl = undefined;
    user.emailPublic = false;
    // prevent login by replacing password
    user.password = await bcrypt.hash(Date.now().toString() + Math.random(), 10);

    await user.save();

    // clear refresh cookie if user deleted themselves
    try {
      res.clearCookie('refreshToken');
    } catch (e) {}

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error anonymizing user:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
