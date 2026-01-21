import * as express from 'express';
import Post from '../models/post';
import Comment from '../models/comment';
import Vote from '../models/vote';
import GameMention from '../models/gameMention';
import User from '../models/user';
import joi from 'joi';
import * as authMiddleware from '../middleware/auth';

const router = express.Router();

const createPostSchema = joi.object({
  title: joi.string().min(1).max(200).required(),
  content: joi.string().max(10000).required(),
  mentionedGames: joi.array().items(joi.object()).optional(),
});

router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortOption = req.query.sort === 'new' ? { createdAt: -1 } : { score: -1, createdAt: -1 };

    const posts = await Post.find()
      .populate('authorId', 'username avatarUrl')
      .sort(sortOption as any)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [{ urlName: req.params.username }, { username: req.params.username }],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await Post.find({ authorId: user._id })
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Post.countDocuments({ authorId: user._id });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('authorId', 'username avatarUrl');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/posts/game/:appid', async (req, res) => {
  try {
    const appid = req.params.appid;

    const appidNumber = parseInt(appid, 10);
    const searchConditions: any[] = [{ 'mentionedGames.appid': appid }];
    if (!isNaN(appidNumber)) {
      searchConditions.push({ 'mentionedGames.appid': appidNumber });
    }

    const posts = await Post.find({
      $or: searchConditions,
    })
      .populate('authorId', 'username avatarUrl')
      .sort({ score: -1, createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts for game:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/posts', authMiddleware.auth, async (req: any, res) => {
  try {
    const { error } = createPostSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { title, content, mentionedGames } = req.body;

    const post = new Post({
      authorId: req.user.id,
      title,
      content,
      mentionedGames: mentionedGames || [],
    });

    await post.save();

    if (mentionedGames && mentionedGames.length > 0) {
      const mentions = mentionedGames.map((game: any) => ({
        gameAppId: game.appid,
        postId: post._id,
        authorId: req.user.id,
        postTitle: title,
      }));
      await GameMention.insertMany(mentions);
    }

    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: 1 } });

    const populatedPost = await Post.findById(post._id).populate('authorId', 'username avatarUrl');
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/posts/:id', authMiddleware.auth, async (req: any, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (new Date() > post.editableUntil) {
      return res.status(403).json({ error: 'Edit time expired (1 hour limit)' });
    }

    const { title, content, mentionedGames } = req.body;

    if (title) post.title = title;
    if (content) post.content = content;
    if (mentionedGames) {
      post.mentionedGames = mentionedGames;
      await GameMention.deleteMany({ postId: post._id });
      if (mentionedGames.length > 0) {
        const mentions = mentionedGames.map((game: any) => ({
          gameAppId: game.appid,
          postId: post._id,
          authorId: req.user.id,
          postTitle: title || post.title,
        }));
        await GameMention.insertMany(mentions);
      }
    }

    post.isEdited = true;
    post.updatedAt = new Date();
    await post.save();

    const populatedPost = await Post.findById(post._id).populate('authorId', 'username avatarUrl');
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/posts/:id', authMiddleware.auth, async (req: any, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Comment.deleteMany({ rootId: post._id, rootType: 'post' });
    await Vote.deleteMany({ targetId: post._id, targetType: 'post' });
    await GameMention.deleteMany({ postId: post._id });

    await Post.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: -1 } });

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/games/:appid/mentions', async (req, res) => {
  try {
    const appid = req.params.appid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const mentions = await GameMention.find({ gameAppId: appid })
      .populate('authorId', 'username avatarUrl')
      .populate('postId', 'title score commentCount createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await GameMention.countDocuments({ gameAppId: appid });

    res.json({
      mentions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
