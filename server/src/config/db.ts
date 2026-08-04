import mongoose from 'mongoose';
import dns from 'dns';

// Set public DNS resolvers to ensure Node.js can resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if custom DNS setting is restricted
}

export const connectDB = async (): Promise<void> => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-crm';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/ai-crm';

  // Register disconnect event (only once)
  mongoose.connection.once('disconnected', () => {
    console.log('MongoDB Atlas disconnected.');
  });

  // Attempt Atlas first, fall back to local
  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Atlas connected successfully.');
  } catch (primaryErr: any) {
    try {
      await mongoose.connect(localFallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('Connected to local MongoDB fallback.');
    } catch (fallbackErr: any) {
      console.error('MongoDB Atlas connection failed.');
      throw new Error('MongoDB Atlas connection failed. Server cannot start without database.');
    }
  }
};
