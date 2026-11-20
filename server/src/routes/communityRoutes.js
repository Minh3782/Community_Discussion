import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMembership, joinCommunity, leaveCommunity } from '../controllers/membershipController.js';

const router = Router();

// Every community route needs a logged-in user (any role)
router.use(requireAuth);
router
  .route('/:communityId/membership')
  .get(getMembership)
  .post(joinCommunity)
  .delete(leaveCommunity);

export default router;
