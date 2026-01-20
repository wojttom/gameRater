import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: 'post' | 'comment' | 'review' | 'user';
  targetId: mongoose.Types.ObjectId;
  value: 1 | -1;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: {
    type: String,
    enum: ['post', 'comment', 'review', 'user'],
    required: true,
  },
  targetId: { type: Schema.Types.ObjectId, required: true },
  value: { type: Number, enum: [1, -1], required: true },
  createdAt: { type: Date, default: Date.now },
});

VoteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
VoteSchema.index({ targetId: 1, targetType: 1 });

export default mongoose.model<IVote>('Vote', VoteSchema);
