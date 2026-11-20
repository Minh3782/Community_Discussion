import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({

  // Duc requested title and content fields (Story U4)
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },

  // Link this discussion to a specific community
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },

  // Link this discussion to the user who created it
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Discussion', discussionSchema);