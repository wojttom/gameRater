import * as express from 'express';
import Comment from '../models/comment';
import Post from '../models/post';
import Review from '../models/review';
import Vote from '../models/vote';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/comments/:rootType/:rootId', async (req, res) => {
  try {
    const { rootType, rootId } = req.params;

    if (!['post', 'review'].includes(rootType)) {
      return res.status(400).json({ error: 'Invalid root type' });
    }

    const comments = await Comment.find({ rootId, rootType })
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: 1 });

    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach((comment) => {
      const commentObj: any = comment.toObject();
      commentObj.replies = [];
      commentMap.set(comment._id.toString(), commentObj);
    });

    comments.forEach((comment) => {
      const commentObj = commentMap.get(comment._id.toString());
      if (comment.parentType === 'comment') {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    res.json(rootComments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:userId/comments', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const comments = await Comment.find({ authorId: req.params.userId })
      .populate('authorId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Comment.countDocuments({ authorId: req.params.userId });

    res.json({
      comments,
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

router.post('/comments', auth, async (req: any, res) => {
  try {
    const { parentType, parentId, rootId, rootType, content } = req.body;

    if (!content || !parentType || !parentId || !rootId || !rootType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let depth = 0;
    if (parentType === 'comment') {
      const parentComment = await Comment.findById(parentId);
      if (parentComment) {
        depth = parentComment.depth + 1;
      }
    }

    const comment = new Comment({
      authorId: req.user.id,
      parentType,
      parentId,
      rootId,
      rootType,
      content,
      depth,
    });

    await comment.save();

    if (parentType === 'comment') {
      await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
    }

    if (rootType === 'post') {
      await Post.findByIdAndUpdate(rootId, { $inc: { commentCount: 1 } });
    } else if (rootType === 'review') {
      await Review.findByIdAndUpdate(rootId, { $inc: { commentCount: 1 } });
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      'authorId',
      'username avatarUrl',
    );

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/comments/:id', auth, async (req: any, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (new Date() > comment.editableUntil) {
      return res.status(403).json({ error: 'Edit time expired (1 hour limit)' });
    }

    const { content } = req.body;
    if (content) {
      comment.content = content;
      comment.isEdited = true;
      comment.updatedAt = new Date();
      await comment.save();
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      'authorId',
      'username avatarUrl',
    );

    res.json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/comments/:id', auth, async (req: any, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const deleteReplies = async (parentId: string) => {
      const replies = await Comment.find({ parentId, parentType: 'comment' });
      for (const reply of replies) {
        await deleteReplies(reply._id.toString());
        await Vote.deleteMany({ targetId: reply._id, targetType: 'comment' });
        await Comment.findByIdAndDelete(reply._id);
      }
    };

    await deleteReplies(req.params.id);
    await Vote.deleteMany({ targetId: comment._id, targetType: 'comment' });

    if (comment.parentType === 'comment') {
      await Comment.findByIdAndUpdate(comment.parentId, { $inc: { replyCount: -1 } });
    }

    await Comment.findByIdAndDelete(req.params.id);

    const actualCount = await Comment.countDocuments({
      rootId: comment.rootId,
      rootType: comment.rootType,
    });

    if (comment.rootType === 'post') {
      await Post.findByIdAndUpdate(comment.rootId, { commentCount: actualCount });
    } else if (comment.rootType === 'review') {
      await Review.findByIdAndUpdate(comment.rootId, { commentCount: actualCount });
    }

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
