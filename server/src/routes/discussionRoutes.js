import { Router } from 'express';
import { listDiscussions } from '../controllers/discussionController.js';
import { requireAuth, requireMember } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireMember, listDiscussions);

export default router;
