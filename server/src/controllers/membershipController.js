import mongoose from 'mongoose';
import Community from '../models/Community.js';
import Membership from '../models/Membership.js';
import { httpError } from '../utils/httpError.js';

async function findCommunityId(communityId) {
  if (!mongoose.isObjectIdOrHexString(communityId)) throw httpError(400, 'Invalid community ID.');
  if (!(await Community.exists({ _id: communityId }))) throw httpError(404, 'Community not found.');
  return new mongoose.Types.ObjectId(String(communityId));
}

const membershipView = (community, member) => ({ community: String(community), member });

// GET /api/communities/:communityId/membership -> is the current user a member? (for the Join/Leave button)
export async function getMembership(req, res) {
  const community = await findCommunityId(req.params.communityId);
  const member = Boolean(await Membership.exists({ user: req.user._id, community }));
  res.json(membershipView(community, member));
}

// POST /api/communities/:communityId/membership -> join (201 when joined now, 200 if already a member)
export async function joinCommunity(req, res) {
  const community = await findCommunityId(req.params.communityId);
  let joined = false;
  try {
    const result = await Membership.updateOne(
      { user: req.user._id, community },
      { $setOnInsert: { user: req.user._id, community } },
      { upsert: true },
    );
    joined = result.upsertedCount === 1;
  } catch (err) {
    // Two join clicks at the same moment: the unique index rejects the second, which is still "a member"
    if (err.code !== 11000) throw err;
  }
  res.status(joined ? 201 : 200).json(membershipView(community, true));
}

// DELETE /api/communities/:communityId/membership -> leave (200 even if not a member, so retries are safe)
export async function leaveCommunity(req, res) {
  const community = await findCommunityId(req.params.communityId);
  await Membership.deleteOne({ user: req.user._id, community });
  res.json(membershipView(community, false));
}
