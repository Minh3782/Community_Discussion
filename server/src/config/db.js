import mongoose from 'mongoose';

/**
 * TODO(database): MongoDB collections for this project are still to be set up
 * by the team. Login/registration currently use the in-memory store in
 * src/data/userStore.js, so the server keeps running even without MongoDB.
 */
export default async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set: skipping MongoDB connection.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.warn(`MongoDB not reachable (${err.message}). Continuing without it.`);
  }
}
