import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },

    // Linked to the User table
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },

    // Ready to link to the Discussion table (Story U4)
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discussion',
      required: true
    }
  },
  { timestamps: true }
);

// Story U5: posts in a discussion are listed by timestamp, so index that lookup
postSchema.index({ discussion: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
