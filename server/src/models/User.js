import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true, // Support Minh check emails that are already registered
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true // bcrypt hash, never the raw password
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'], // 3 roles as per C1 requirement
    default: 'user'
  },

  // Login lockout (5 min after 5 failed attempts)
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  // Password reset (sha256 of the emailed token)
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null }
}, { 
  timestamps: true // Auto-generate createdAt and updatedAt fields
});

export default mongoose.model('User', userSchema);
