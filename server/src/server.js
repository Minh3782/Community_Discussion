import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { seedDemoUsers } from './data/userStore.js';

const PORT = process.env.PORT || 5001;

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is missing. Copy server/.env.example to server/.env.');
  process.exit(1);
}

await connectDB();
await seedDemoUsers();
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
