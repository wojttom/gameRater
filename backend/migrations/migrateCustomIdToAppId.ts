import mongoose from 'mongoose';
import CustomGame from '../models/customGame';

async function migrateCustomIdToAppId() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gameRater');

    console.log('Starting migration: customId → appid...');

    // Find all games - check raw MongoDB documents
    const allGames = await CustomGame.find({}).lean();
    console.log(`Found ${allGames.length} games total`);

    let updated = 0;

    for (const game of allGames) {
      const customId = (game as any).customId;
      const appid = (game as any).appid;

      // Only migrate if customId exists and appid doesn't
      if (customId && !appid) {
        console.log(`Migrating: ${customId} (ID: ${game._id})`);

        // Update the game: set appid to customId value
        await CustomGame.updateOne(
          { _id: game._id },
          {
            $set: { appid: customId },
            $unset: { customId: '' }, // Remove customId field
          }
        );
        updated++;
      } else if (customId && appid) {
        console.log(`Game already has appid: ${appid}, skipping ${game._id}`);
      }
    }

    console.log(`Migration complete: ${updated} games updated`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateCustomIdToAppId();
