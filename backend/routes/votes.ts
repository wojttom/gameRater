import * as express from 'express';
import Vote from '../models/vote';
import Post from '../models/post';
import Comment from '../models/comment';
import Review from '../models/review';
import User from '../models/user';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/vote', auth, async (req: any, res) => {
  try {
    const { targetType, targetId, value } = req.body;

    if (!['post', 'comment', 'review', 'user'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    if (![1, -1].includes(value)) {
      return res.status(400).json({ error: 'Value must be 1 or -1' });
    }

    let target: any;
    let authorId: string;

    if (targetType === 'post') {
      target = await Post.findById(targetId);
    } else if (targetType === 'comment') {
      target = await Comment.findById(targetId);
    } else if (targetType === 'review') {
      target = await Review.findById(targetId);
    } else if (targetType === 'user') {
      target = await User.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }

    if (targetType === 'user') {
      authorId = target._id.toString();
    } else {
      authorId = target.authorId?.toString() || target.userId?.toString();
    }

    if (authorId === req.user.id) {
      return res.status(400).json({ error: 'Cannot vote on your own content' });
    }

    const existingVote = await Vote.findOne({
      userId: req.user.id,
      targetType,
      targetId,
    });

    let upvoteDelta = 0;
    let downvoteDelta = 0;
    let scoreDelta = 0;

    if (existingVote) {
      if (existingVote.value === value) {
        await Vote.findByIdAndDelete(existingVote._id);
        if (value === 1) {
          upvoteDelta = -1;
          scoreDelta = -1;
        } else {
          downvoteDelta = -1;
          scoreDelta = 1;
        }
      } else {
        existingVote.value = value as 1 | -1;
        await existingVote.save();
        if (value === 1) {
          upvoteDelta = 1;
          downvoteDelta = -1;
          scoreDelta = 2;
        } else {
          upvoteDelta = -1;
          downvoteDelta = 1;
          scoreDelta = -2;
        }
      }
    } else {
      const vote = new Vote({
        userId: req.user.id,
        targetType,
        targetId,
        value,
      });
      await vote.save();

      if (value === 1) {
        upvoteDelta = 1;
        scoreDelta = 1;
      } else {
        downvoteDelta = 1;
        scoreDelta = -1;
      }
    }

    const updateData = {
      $inc: {
        upvotes: upvoteDelta,
        downvotes: downvoteDelta,
        score: scoreDelta,
      },
    };

    if (targetType === 'post') {
      await Post.findByIdAndUpdate(targetId, updateData);
    } else if (targetType === 'comment') {
      await Comment.findByIdAndUpdate(targetId, updateData);
    } else if (targetType === 'review') {
      await Review.findByIdAndUpdate(targetId, updateData);
    }

    if (authorId) {
      await User.findByIdAndUpdate(authorId, {
        $inc: { reputation: scoreDelta },
      });
    }

    let updatedTarget: any;
    if (targetType === 'post') {
      updatedTarget = await Post.findById(targetId);
    } else if (targetType === 'comment') {
      updatedTarget = await Comment.findById(targetId);
    } else if (targetType === 'review') {
      updatedTarget = await Review.findById(targetId);
    } else if (targetType === 'user') {
      updatedTarget = await User.findById(targetId);
    }

    if (targetType === 'user') {
      res.json({
        reputation: updatedTarget.reputation,
        userVote: existingVote && existingVote.value === value ? null : value,
      });
    } else {
      res.json({
        upvotes: updatedTarget.upvotes,
        downvotes: updatedTarget.downvotes,
        score: updatedTarget.score,
        userVote: existingVote && existingVote.value === value ? null : value,
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/vote/:targetType/:targetId', auth, async (req: any, res) => {
  try {
    const { targetType, targetId } = req.params;

    const vote = await Vote.findOne({
      userId: req.user.id,
      targetType,
      targetId,
    });

    res.json({ value: vote ? vote.value : null });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/votes/batch', auth, async (req: any, res) => {
  try {
    const { targets } = req.body;

    const votes = await Vote.find({
      userId: req.user.id,
      $or: targets.map((t: any) => ({
        targetType: t.targetType,
        targetId: t.targetId,
      })),
    });

    const voteMap: Record<string, number> = {};
    votes.forEach((vote) => {
      voteMap[`${vote.targetType}_${vote.targetId}`] = vote.value;
    });

    res.json(voteMap);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
