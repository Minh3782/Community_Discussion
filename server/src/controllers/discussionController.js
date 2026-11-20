import Community from '../models/Community.js';
import Discussion from '../models/Discussion.js';

export async function listDiscussions(req, res) {
  const discussions = await Discussion.find()
    .select('title community')
    .sort({ title: 1, _id: 1 })
    .populate({ path: 'community', model: Community, select: 'name' });

  res.json(discussions.filter(({ community }) => community).map(({ id, title, community }) => ({
    id,
    title,
    community: { id: community.id, name: community.name },
  })));
}
