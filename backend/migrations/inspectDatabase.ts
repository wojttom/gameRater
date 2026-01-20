import mongoose from 'mongoose';
import User from '../models/user';

async function inspectDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect('mongodb://localhost:27017/gameRater');

    // Check CustomGame collection
    const customGames = await mongoose.connection.collection('customgames').find({}).toArray();
    console.log('\n=== CustomGame Collection ===');
    console.log(`Total documents: ${customGames.length}`);
    if (customGames.length > 0) {
      customGames.forEach((game: any, i) => {
        console.log(`\n${i + 1}. ${game['name'] || 'NO NAME'}`);
        console.log(`   appid: ${game['appid']}`);
        console.log(`   createdBy: ${game['createdBy']}`);
      });
    }

    // Check Users and their addedGames
    const users = await User.find({});
    console.log('\n=== Users with addedGames ===');
    users.forEach((user: any) => {
      console.log(`${user.username}: ${user.addedGames?.length || 0} games`);
      if (user.addedGames && user.addedGames.length > 0) {
        user.addedGames.forEach((gameId: any) => {
          console.log(`  - ${gameId}`);
        });
      }
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

inspectDatabase();
