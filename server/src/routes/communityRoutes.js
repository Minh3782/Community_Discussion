import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCommunities,
  getCommunity,
  getCommunityDiscussions,
  createDiscussion,
} from '../controllers/communityController.js';
import { getMembership, joinCommunity, leaveCommunity } from '../controllers/membershipController.js';

const router = Router();

// Every community route needs a logged-in user (any role)
router.use(requireAuth);

router.get('/', getCommunities);

// U3: discussions in a community
router
  .route('/:communityId/discussions')
  .get(getCommunityDiscussions)
  .post(createDiscussion);

// U1: join / leave a community
router
  .route('/:communityId/membership')
  .get(getMembership)
  .post(joinCommunity)
  .delete(leaveCommunity);

router.get('/:communityId', getCommunity);

export default router;
