import { Router } from 'express';
import { register, login, logout, me, forgotPassword, resetPassword } from '../controllers/authController.js';

// Express 5 forwards errors thrown in async handlers to the error middleware
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
