import mongoose from 'mongoose';
import Community from '../models/Community.js';
import Discussion from '../models/Discussion.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';

const httpError = (status, message) => Object.assign(new Error(message), { status });
const person = (user) => ({ id: user.id, name: user.name });
const communityView = (community) => ({
  id: community.id,
  name: community.name,
  description: community.description ?? '',
  rules: community.rules ?? '',
  moderators: community.moderators.filter(Boolean).map(person),
});
const moderatorFields = { path: 'moderators', select: 'name' };

function validateId(id, label) {
  if (!mongoose.isObjectIdOrHexString(id)) throw httpError(400, `Invalid ${label} ID.`);
}

export async function listCommunities(req, res) {
  const communities = await Community.find().sort({ name: 1, _id: 1 }).populate(moderatorFields);
  res.json(communities.map(communityView));
}

export async function listModeratorCandidates(req, res) {
  const users = await User.find({ role: 'moderator' }).select('name').sort({ name: 1, _id: 1 });
  res.json(users.map(person));
}

export async function createCommunity(req, res) {
  const { name, description = '', rules = '' } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Community name is required.');
  if (typeof description !== 'string' || typeof rules !== 'string') {
    throw httpError(400, 'Description and rules must be text.');
  }

  try {
    const community = await Community.create({
      name: name.trim(),
      description: description.trim(),
      rules: rules.trim(),
    });
    res.status(201).json(communityView(community));
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'A community with this name already exists.');
    throw err;
  }
}

export async function assignModerator(req, res) {
  const { communityId, userId } = req.params;
  validateId(communityId, 'community');
  validateId(userId, 'user');

  const user = await User.findById(userId).select('role');
  if (!user) throw httpError(404, 'User not found.');
  if (user.role !== 'moderator') throw httpError(400, 'Select a user with the moderator role.');

  const community = await Community.findByIdAndUpdate(
    communityId,
    { $addToSet: { moderators: userId } },
    { returnDocument: 'after' },
  ).populate(moderatorFields);

  if (!community) throw httpError(404, 'Community not found.');
  res.json(communityView(community));
}

export async function deleteCommunity(req, res) {
  const { communityId } = req.params;
  validateId(communityId, 'community');

  const [membership, discussion] = await Promise.all([
    Membership.exists({ community: communityId }),
    Discussion.exists({ community: communityId }),
  ]);
  if (membership || discussion) {
    if (!(await Community.exists({ _id: communityId }))) throw httpError(404, 'Community not found.');
    throw httpError(409, 'This community has memberships or discussions and cannot be deleted.');
  }

  const { deletedCount } = await Community.deleteOne({ _id: communityId });
  if (!deletedCount) throw httpError(404, 'Community not found.');
  res.status(204).end();
}
