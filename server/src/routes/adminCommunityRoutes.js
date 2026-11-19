import { Router } from 'express';
import { findById } from '../data/userStore.js';
import { requireAuth } from '../middleware/auth.js';
import {
  assignModerator, createCommunity, deleteCommunity, listCommunities, listModeratorCandidates,
} from '../controllers/adminCommunityController.js';

const router = Router();

router.use(requireAuth, async (req, res, next) => {
  const user = await findById(req.session.userId);
  if (!user) return res.status(401).json({ message: 'Not logged in.' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'Forbidden.' });
  next();
});

router.route('/communities').get(listCommunities).post(createCommunity);
router.get('/moderator-candidates', listModeratorCandidates);
router.put('/communities/:communityId/moderators/:userId', assignModerator);
router.delete('/communities/:communityId', deleteCommunity);

export default router;
