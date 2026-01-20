import mongoose from 'mongoose';
import User from '../models/user';
import CustomGame from '../models/customGame';

async function syncAddedGames() {
  try {
    console.log('Starting migration: Sync addedGames references...');

    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/gameRater');

    // Get all custom games
    const customGames = await CustomGame.find();
    console.log(`Found ${customGames.length} custom games`);

    let synced = 0;
    let skipped = 0;

    for (const game of customGames) {
      const creatorId = game.createdBy;

      if (!creatorId) {
        console.log(`Game ${game.appid} has no createdBy, skipping`);
        skipped++;
        continue;
      }

      // Check if this game is already in user's addedGames
      const user = await User.findById(creatorId);

      if (!user) {
        console.log(`User ${creatorId} not found for game ${game.appid}`);
        skipped++;
        continue;
      }

      const gameExists = user.addedGames.some((id) => id.toString() === game._id.toString());

      if (!gameExists) {
        // Add game to user's addedGames
        await User.findByIdAndUpdate(creatorId, { $push: { addedGames: game._id } }, { new: true });
        console.log(`✓ Added game ${game.appid} to user ${user.username}'s addedGames`);
        synced++;
      } else {
        console.log(`• Game ${game.appid} already in user ${user.username}'s addedGames`);
        skipped++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Synced: ${synced}`);
    console.log(`Skipped/Already present: ${skipped}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

syncAddedGames();
