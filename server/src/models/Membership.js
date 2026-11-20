import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  }
}, { timestamps: true });

// Ensure a user can only join a community once (prevent duplicate entries)
membershipSchema.index({ user: 1, community: 1 }, { unique: true });

export default mongoose.model('Membership', membershipSchema);