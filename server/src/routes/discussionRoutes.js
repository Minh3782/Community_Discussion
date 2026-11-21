import { Router } from 'express';
import { getDiscussion, listDiscussions } from '../controllers/discussionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('user'), listDiscussions);
router.get('/:discussionId', requireAuth, getDiscussion);

export default router;
