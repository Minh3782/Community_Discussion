import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Community from './src/models/Community.js';

// Read the .env file to get the MongoDB connection string
dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!');

    // Create a sample user
    const testUser = new User({
      email: 'testuser@gmail.com',
      password: 'password123', // Temporary password for testing
      role: 'user'
    });
    const savedUser = await testUser.save();
    console.log('Created test User:', savedUser.email);

    // Create a sample community with the above user as a moderator
    const testCommunity = new Community({
      name: 'Coding Enthusiasts',
      description: 'A place to discuss code',
      rules: 'No spamming',
      moderators: [savedUser._id]
    });
    await testCommunity.save();
    console.log('Created test Community:', testCommunity.name);

    console.log('Data seeding completed!');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedData();