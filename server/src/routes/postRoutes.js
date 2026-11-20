import { Router } from 'express';
import { getPosts, createPost } from '../controllers/postController.js';

import { requireAuth, requireMember } from '../middleware/auth.js';

const router = Router();

router.route('/').get(getPosts).post(requireAuth, requireMember, createPost);

export default router;
