import mongoose, { Document, Schema } from 'mongoose';

export interface IGameMention extends Document {
  gameAppId: string | number;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  postTitle: string;
  createdAt: Date;
}

const GameMentionSchema: Schema = new Schema({
  gameAppId: { type: Schema.Types.Mixed, required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postTitle: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

GameMentionSchema.index({ gameAppId: 1, createdAt: -1 });
GameMentionSchema.index({ postId: 1 });

export default mongoose.model<IGameMention>('GameMention', GameMentionSchema);
