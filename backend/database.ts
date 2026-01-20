import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const uri = process.env['MONGO_URI'] || 'mongodb://localhost:27017/gameRater';

export async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB:', uri);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

export default mongoose;
