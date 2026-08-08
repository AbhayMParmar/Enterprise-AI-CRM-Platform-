import mongoose from 'mongoose';
import dns from 'dns';

// Set public DNS resolvers to ensure Node.js can resolve MongoDB Atlas SRV records in serverless/Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if custom DNS setting is restricted
}

const ATLAS_DEFAULT_URI = 'mongodb+srv://Abhay:admin123@cluster0.kl2spzo.mongodb.net/ai-crm?retryWrites=true&w=majority';

export const connectDB = async (): Promise<void> => {
  // If already connected, skip
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const primaryUri = process.env.MONGO_URI || ATLAS_DEFAULT_URI;
  const localFallbackUri = 'mongodb://127.0.0.1:27017/ai-crm';

  // Register disconnect event (only once)
  if (mongoose.connection.listeners('disconnected').length === 0) {
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected.');
    });
  }

  // Attempt Atlas connection
  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully.');
  } catch (primaryErr: any) {
    console.warn('MongoDB Atlas connection warning:', primaryErr?.message);
    try {
      await mongoose.connect(localFallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('Connected to local MongoDB fallback.');
    } catch (fallbackErr: any) {
      console.error('MongoDB connection failed across all URIs:', fallbackErr?.message);
    }
  }
};
