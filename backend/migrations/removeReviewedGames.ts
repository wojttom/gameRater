import mongoose from 'mongoose';
import User from '../models/user';

async function migrateRemoveReviewedGames() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gameRater');

    const result = await User.updateMany(
      { reviewedGames: { $exists: true } },
      { $unset: { reviewedGames: '' } }
    );

    console.log(`Removed reviewedGames field from ${result.modifiedCount} records`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateRemoveReviewedGames();
