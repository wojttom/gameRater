import mongoose from 'mongoose';
import User from '../models/user';

async function migrateAddToBuy() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gameRater');

    const result = await User.updateMany({ toBuy: { $exists: false } }, { $set: { toBuy: [] } });

    console.log(`Updated ${result.modifiedCount} records`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateAddToBuy();
