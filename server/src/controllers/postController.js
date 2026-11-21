import mongoose from 'mongoose';
import Community from '../models/Community.js';
import Discussion from '../models/Discussion.js';
import Membership from '../models/Membership.js';
import Post from '../models/Post.js';
import { httpError } from '../utils/httpError.js';

export const TITLE_MAX = 200;
export const BODY_MAX = 10000;
const LIST_LIMIT = 100; // no paging yet; add ?page= when lists grow

// U5: posts are ordered by when they were published, never by views.
// _id breaks ties so posts saved in the same millisecond keep a stable order.
const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
};

const isId = (value) => typeof value === 'string' && mongoose.isObjectIdOrHexString(value);
const text = (value) => (typeof value === 'string' ? value.trim() : '');

// Only these fields are ever sent to the browser (author is populated with name only)
const postView = (post, communityId) => ({
  id: post.id,
  title: post.title,
  body: post.body,
  author: post.author ? { id: post.author.id, name: post.author.name } : null,
  discussion: String(post.discussion),
  community: String(communityId),
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

async function findDiscussion(discussionId) {
  if (!isId(discussionId)) throw httpError(400, 'Invalid discussion ID.');
  const discussion = await Discussion.findById(discussionId).select('community');
  if (!discussion) throw httpError(404, 'Discussion not found.');
  return discussion;
}

// POST /api/posts  { title, body, discussionId, communityId? }   (story U4)
export async function createPost(req, res) {
  const { discussionId, communityId } = req.body ?? {};
  const title = text(req.body?.title);
  const body = text(req.body?.body);

  // Required-field validation; every problem is reported at once so the form can mark each field
  const fields = {};
  if (!title) fields.title = 'Title is required.';
  else if (title.length > TITLE_MAX) fields.title = `Title must be ${TITLE_MAX} characters or fewer.`;
  if (!body) fields.body = 'Content is required.';
  else if (body.length > BODY_MAX) fields.body = `Content must be ${BODY_MAX} characters or fewer.`;
  if (!discussionId) fields.discussionId = 'Select a discussion.';
  else if (!isId(discussionId)) fields.discussionId = 'Invalid discussion ID.';
  if (communityId !== undefined && !isId(communityId)) fields.communityId = 'Invalid community ID.';
  if (Object.keys(fields).length) throw httpError(400, Object.values(fields)[0], { fields });

  const discussion = await findDiscussion(discussionId);
  if (!discussion.community || !(await Community.exists({ _id: discussion.community }))) {
    throw httpError(404, 'Discussion community not found.');
  }
  if (communityId && !discussion.community.equals(communityId)) {
    throw httpError(400, 'This discussion does not belong to the selected community.');
  }
  // Only members of the community may post in it (join via POST /api/communities/:id/membership)
  if (!(await Membership.exists({ user: req.user._id, community: discussion.community }))) {
    throw httpError(403, 'Join this community to post in it.');
  }

  // The author always comes from the session, never from the request body
  const post = await Post.create({ title, body, author: req.user._id, discussion: discussion._id });
  await post.populate('author', 'name');
  res.status(201).json(postView(post, discussion.community));
}

// GET /api/posts?discussionId=...|communityId=...&sort=newest|oldest   (story U5)
export async function listPosts(req, res) {
  const { discussionId, communityId, sort = 'newest' } = req.query;
  if (!Object.hasOwn(SORTS, sort)) throw httpError(400, 'sort must be "newest" or "oldest".');
  if (!discussionId === !communityId) throw httpError(400, 'Provide either discussionId or communityId.');

  let filter;
  let community;
  if (discussionId) {
    const discussion = await findDiscussion(discussionId);
    filter = { discussion: discussion._id };
    community = discussion.community;
  } else {
    if (!isId(communityId)) throw httpError(400, 'Invalid community ID.');
    if (!(await Community.exists({ _id: communityId }))) throw httpError(404, 'Community not found.');
    const discussionIds = await Discussion.find({ community: communityId }).distinct('_id');
    filter = { discussion: { $in: discussionIds } };
    community = communityId;
  }

  const posts = await Post.find(filter).sort(SORTS[sort]).limit(LIST_LIMIT).populate('author', 'name');
  res.json(posts.map((post) => postView(post, community)));
}
