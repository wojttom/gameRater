import express from 'express';
import CustomGame from '../models/customGame';
import User from '../models/user';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      detailed_description,
      about_the_game,
      short_description,
      header_image,
      capsule_image,
      price_overview,
      platforms,
      developers,
      publishers,
      categories,
      genres,
      screenshots,
      movies,
      createdBy,
      release_date,
      is_free,
      website,
    } = req.body;

    if (!name || !createdBy) {
      return res.status(400).json({ error: 'Name and createdBy are required' });
    }

    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const randomDigit = Math.floor(Math.random() * 10);
    const baseId = Date.now().toString().slice(-6);
    const appid = `c${randomDigit}${baseId}`;

    const customGame = new CustomGame({
      appid,
      name,
      type: type || 'game',
      detailed_description,
      about_the_game,
      short_description,
      header_image,
      capsule_image,
      price_overview,
      platforms: platforms || { windows: true, mac: false, linux: false },
      developers: developers || [],
      publishers: publishers || [],
      categories: categories || [],
      genres: genres || [],
      screenshots: screenshots || [],
      movies: movies || [],
      createdBy,
      release_date: release_date || { coming_soon: false, date: new Date().toISOString() },
      is_free: is_free || false,
      website,
    });

    await customGame.save();

    await User.findByIdAndUpdate(createdBy, {
      $push: { addedGames: customGame._id },
    });

    res.status(201).json(customGame);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:appid', async (req, res) => {
  try {
    const game = await CustomGame.findOne({ appid: req.params.appid }).populate(
      'createdBy',
      'username avatarUrl',
    );
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const term = req.query.term as string;
    if (!term) {
      return res.status(400).json({ error: 'Search term required' });
    }

    const games = await CustomGame.find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { about_the_game: { $regex: term, $options: 'i' } },
      ],
    })
      .limit(20)
      .select('appid name header_image capsule_image price_overview');

    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/games/custom/:appid', async (req, res) => {
  try {
    const { createdBy } = req.body;
    const game = await CustomGame.findOne({ appid: req.params.appid });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.createdBy.toString() !== createdBy) {
      return res.status(403).json({ error: 'Only creator can update this game' });
    }

    const allowedFields = [
      'name',
      'type',
      'detailed_description',
      'about_the_game',
      'short_description',
      'header_image',
      'capsule_image',
      'price_overview',
      'platforms',
      'developers',
      'publishers',
      'categories',
      'genres',
      'screenshots',
      'movies',
      'website',
      'release_date',
      'is_free',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (game as any)[field] = req.body[field];
      }
    });

    await game.save();
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/games/custom/:appid', async (req, res) => {
  try {
    const { createdBy } = req.body;
    const game = await CustomGame.findOne({ appid: req.params.appid });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.createdBy.toString() !== createdBy) {
      return res.status(403).json({ error: 'Only creator can delete this game' });
    }

    await CustomGame.deleteOne({ appid: req.params.appid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const games = await CustomGame.find({ createdBy: user._id }).sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
