import mongoose, { Document, Schema } from 'mongoose';

export interface IMentionedGame {
  appid: string | number;
  name: string;
  tiny_image?: string;
}

export interface IPost extends Document {
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  mentionedGames: IMentionedGame[];
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  editableUntil: Date;
}

const PostSchema: Schema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 10000 },
  mentionedGames: [
    {
      appid: { type: Schema.Types.Mixed, required: true },
      name: { type: String, required: true },
      tiny_image: { type: String },
    },
  ],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  isEdited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  editableUntil: { type: Date },
});

PostSchema.pre('save', function () {
  if (this.isNew) {
    this['editableUntil'] = new Date(Date.now() + 60 * 60 * 1000);
  }
});

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ score: -1, createdAt: -1 });

export default mongoose.model<IPost>('Post', PostSchema);
