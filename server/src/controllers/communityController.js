import mongoose from 'mongoose';
import Community from '../models/Community.js';
import Discussion from '../models/Discussion.js';
import User from '../models/User.js';

async function findCommunity(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(
      new Error('Invalid community ID.'),
      { status: 400 }
    );
  }

  const community = await Community.findById(id)
    .select('name description rules')
    .lean();

  if (!community) {
    throw Object.assign(
      new Error('Community not found.'),
      { status: 404 }
    );
  }

  return community;
}

export const getCommunities = async (req, res) => {
  const communities = await Community.find()
    .select('name description rules')
    .sort({ name: 1 })
    .lean();

  res.json(communities);
};

export const getCommunity = async (req, res) => {
  const community = await findCommunity(req.params.communityId);
  res.json(community);
};

export const getCommunityDiscussions = async (req, res) => {
  const community = await findCommunity(req.params.communityId);

  const discussions = await Discussion.find({
    community: community._id,
  })
    .select('title content community creator createdAt updatedAt')
    .populate('creator', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.json(discussions);
};
export const createDiscussion = async (req, res) => {
  const community = await findCommunity(req.params.communityId);
  const creatorId = req.session?.userId;

  if (!mongoose.isValidObjectId(creatorId)) {
    return res.status(401).json({ message: 'Please log in again.' });
  }

  const creator = await User.findById(creatorId).select('_id');

  if (!creator) {
    return res.status(401).json({ message: 'Please log in again.' });
  }

  const title =
    typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  const content =
    typeof req.body?.content === 'string' ? req.body.content.trim() : '';

  if (!title || !content) {
    return res.status(400).json({
      message: 'Enter a discussion title and content.',
    });
  }

  const discussion = await Discussion.create({
    title,
    content,
    community: community._id,
    creator: creator._id,
  });

  await discussion.populate('creator', 'name');

  res.status(201).json(discussion);
};