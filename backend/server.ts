import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { connectDB } from './database';
import authRoutes from './routes/auth';
import steamRoutes from './routes/steamRoutes';
import userRoutes from './routes/user';
import customGamesRoutes from './routes/customGames';
import postsRoutes from './routes/posts';
import commentsRoutes from './routes/comments';
import votesRoutes from './routes/votes';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/api', userRoutes);
app.use('/api', postsRoutes);
app.use('/api', commentsRoutes);
app.use('/api', votesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/steam', steamRoutes);
app.use('/api/games', customGamesRoutes);

connectDB()
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database. Server not started.', error);
  });
