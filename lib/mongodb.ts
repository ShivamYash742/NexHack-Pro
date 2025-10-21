import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB Atlas');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    
    // Provide more helpful error messages
    if (e instanceof Error) {
      if (e.message.includes('IP')) {
        console.error('💡 Solution: Add your IP address to MongoDB Atlas IP whitelist');
        console.error('💡 Your current IP: 103.16.31.13');
      } else if (e.message.includes('authentication')) {
        console.error('💡 Solution: Check your MongoDB username and password');
      } else if (e.message.includes('MONGODB_URI')) {
        console.error('💡 Solution: Set MONGODB_URI environment variable in .env.local');
      }
    }
    
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
