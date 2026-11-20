import { Router } from 'express';
import { listDiscussions } from '../controllers/discussionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('user'), listDiscussions);

export default router;
