import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { seedDatabase } from './config/seed';
import redisService from './services/redisService';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Start Express app listening IMMEDIATELY so port 5000 is open
  const server = app.listen(PORT);

  // 2. Connect to Database
  connectDB()
    .then(async () => {
      await seedDatabase();
    })
    .catch((err) => {
      console.error('Database connection process encountered error:', err.message);
    });

  // Graceful shutdown
  const shutdown = async () => {
    server.close(async () => {
      await redisService.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((error) => {
  console.error('Critical failure initiating server:', error);
  process.exit(1);
});
