import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  emailPublic?: boolean;
  bio?: string;
  favorites: any[];
  addedGames: mongoose.Types.ObjectId[];
  reputation: number;
  postCount: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarUrl: { type: String },
  emailPublic: { type: Boolean, default: false },
  bio: { type: String, default: '' },
  favorites: [
    {
      appid: { type: Schema.Types.Mixed },
      name: String,
      header_image: String,
      capsule_image: String,
    },
  ],
  addedGames: [{ type: Schema.Types.ObjectId, ref: 'CustomGame' }],
  reputation: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
