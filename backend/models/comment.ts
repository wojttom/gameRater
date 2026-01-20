import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  authorId: mongoose.Types.ObjectId;
  parentType: 'post' | 'review' | 'comment';
  parentId: mongoose.Types.ObjectId;
  rootId: mongoose.Types.ObjectId;
  rootType: 'post' | 'review';
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  replyCount: number;
  depth: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  editableUntil: Date;
}

const CommentSchema: Schema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentType: {
    type: String,
    enum: ['post', 'review', 'comment'],
    required: true,
  },
  parentId: { type: Schema.Types.ObjectId, required: true },
  rootId: { type: Schema.Types.ObjectId, required: true },
  rootType: {
    type: String,
    enum: ['post', 'review'],
    required: true,
  },
  content: { type: String, required: true, maxlength: 5000 },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  depth: { type: Number, default: 0 },
  isEdited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  editableUntil: { type: Date },
});

CommentSchema.pre('save', function () {
  if (this.isNew) {
    this['editableUntil'] = new Date(Date.now() + 60 * 60 * 1000);
  }
});

CommentSchema.index({ rootId: 1, rootType: 1, createdAt: 1 });
CommentSchema.index({ parentId: 1, parentType: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
