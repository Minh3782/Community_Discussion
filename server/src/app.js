import express from 'express';
import cors from 'cors';
import session from 'express-session';
import discussionRoutes from './routes/discussionRoutes.js';
import postRoutes from './routes/postRoutes.js';
import adminCommunityRoutes from './routes/adminCommunityRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (isProd) app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

/**
 * Login sessions (cookie "sid" holds only a random id; data stays on the server).
 * TODO(database): the default MemoryStore loses sessions on restart and is not
 * meant for production. Once MongoDB is set up, add `connect-mongo`:
 *   store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
 */
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 1000 * 60 * 60 * 2 },
  })
);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/admin', adminCommunityRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
