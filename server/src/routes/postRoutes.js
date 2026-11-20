import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createPost, listPosts } from '../controllers/postController.js';

const router = Router();

// Every post route needs a logged-in user (any role)
router.use(requireAuth);
router.route('/').get(listPosts).post(createPost);

export default router;
