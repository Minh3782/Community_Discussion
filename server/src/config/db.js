import mongoose from 'mongoose';

// Users now live in MongoDB, so the server cannot run without it.
export default async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing in server/.env');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`MongoDB not reachable (${err.message}). Check MONGO_URI in server/.env.`);
    process.exit(1);
  }
}
