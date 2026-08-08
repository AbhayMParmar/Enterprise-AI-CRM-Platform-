import mongoose from 'mongoose';
import dns from 'dns';

// Set public DNS resolvers to ensure Node.js can resolve MongoDB Atlas SRV records in serverless/Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if custom DNS setting is restricted
}

const ATLAS_DEFAULT_URI = 'mongodb+srv://Abhay:admin123@cluster0.kl2spzo.mongodb.net/ai-crm?retryWrites=true&w=majority';

let dbPromise: Promise<typeof mongoose | null> | null = null;

export const connectDB = async (): Promise<typeof mongoose | null> => {
  // 1. If already connected, return immediately (0ms delay)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2. If a connection is already in progress, reuse the existing promise (prevents concurrent race delays)
  if (dbPromise) {
    return dbPromise;
  }

  const primaryUri = process.env.MONGO_URI || ATLAS_DEFAULT_URI;
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  // Register disconnect listener (only once)
  if (mongoose.connection.listeners('disconnected').length === 0) {
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected.');
      dbPromise = null;
    });
  }

  dbPromise = (async () => {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 3000, // Fast 3-second selection timeout
        connectTimeoutMS: 3000,        // Fast 3-second connection timeout
      });
      console.log('✅ MongoDB connected successfully.');
      return conn;
    } catch (primaryErr: any) {
      console.warn('MongoDB Atlas connection warning:', primaryErr?.message);
      dbPromise = null;

      // On Vercel/Production, localhost doesn't exist — skip local fallback to prevent 3s delay
      if (isProduction) {
        return null;
      }

      try {
        const localFallbackUri = 'mongodb://127.0.0.1:27017/ai-crm';
        const conn = await mongoose.connect(localFallbackUri, {
          serverSelectionTimeoutMS: 1500,
        });
        console.log('Connected to local MongoDB fallback.');
        return conn;
      } catch (fallbackErr: any) {
        console.error('MongoDB connection failed across all URIs:', fallbackErr?.message);
        return null;
      }
    }
  })();

  return dbPromise;
};
