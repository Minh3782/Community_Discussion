import mongoose from 'mongoose';
import Community from '../models/Community.js';
import Discussion from '../models/Discussion.js';
import Membership from '../models/Membership.js';
import { httpError } from '../utils/httpError.js';

export async function getDiscussion(req, res) {
  const { discussionId } = req.params;
  if (!mongoose.isObjectIdOrHexString(discussionId)) throw httpError(400, 'Invalid discussion ID.');

  const discussion = await Discussion.findById(discussionId)
    .select('title content community creator createdAt')
    .populate('creator', 'name')
    .lean();

  if (!discussion) throw httpError(404, 'Discussion not found.');
  res.json(discussion);
}

export async function listDiscussions(req, res) {
  const communityIds = await Membership.distinct('community', { user: req.user._id });
  const discussions = await Discussion.find({ community: { $in: communityIds } })
    .select('title community')
    .sort({ title: 1, _id: 1 })
    .populate({ path: 'community', model: Community, select: 'name' });

  res.json(discussions.filter(({ community }) => community).map(({ id, title, community }) => ({
    id,
    title,
    community: { id: community.id, name: community.name },
  })));
}
