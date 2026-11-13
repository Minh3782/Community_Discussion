import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Support Minh check emails that are already registered
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'], // 3 roles as per C1 requirement
    default: 'user'
  }
}, { 
  timestamps: true // Auto-generate createdAt and updatedAt fields
});

export default mongoose.model('User', userSchema);