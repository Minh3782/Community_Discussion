import mongoose from 'mongoose';
import Community from '../models/Community.js';
import Discussion from '../models/Discussion.js';
import Post from '../models/Post.js';

export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

export async function createPost(req, res) {
  const { title, body, discussion } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim() || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }
  if (typeof discussion !== 'string' || !mongoose.isObjectIdOrHexString(discussion)) {
    return res.status(400).json({ message: 'Invalid discussion ID.' });
  }

  const target = await Discussion.findById(discussion).select('community');
  if (!target || !target.community || !(await Community.exists({ _id: target.community }))) {
    return res.status(404).json({ message: 'Discussion or its community not found.' });
  }

  const post = await Post.create({
    title: title.trim(),
    body: body.trim(),
    discussion: target._id,
    author: req.session.userId,
  });
  res.status(201).json(post);
}
