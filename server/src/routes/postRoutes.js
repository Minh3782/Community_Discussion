import { Router } from 'express';
import { getPosts, createPost } from '../controllers/postController.js';

const router = Router();

router.route('/').get(getPosts).post(createPost);

export default router;
