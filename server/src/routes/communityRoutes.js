import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCommunities,
  getCommunity,
  getCommunityDiscussions,
  createDiscussion,
} from '../controllers/communityController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getCommunities);

router
  .route('/:communityId/discussions')
  .get(getCommunityDiscussions)
  .post(createDiscussion);

router.get('/:communityId', getCommunity);

export default router;