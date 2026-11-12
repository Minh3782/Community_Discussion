# Community Discussion (MERN)

- **M**ongoDB: database (local: `mongodb://127.0.0.1:27017/community_discussion`)
- **E**xpress + **N**ode.js: REST API in `server/` (port 5001)
- **R**eact (Vite): web frontend in `client/` (port 5173)

## Setup
```bash
npm run install:all          # install root, server and client deps
cp server/.env.example server/.env   # then edit if needed
```
MongoDB is optional for now (login uses an in-memory store). If it isn't running the server logs a warning and continues.

## Run
```bash
npm run dev      # starts API + frontend together
```
Open http://localhost:5173. The Vite dev server forwards `/api/*` to the Express server.

## Structure
```
server/src/
  config/db.js        MongoDB connection
  models/             Mongoose schemas
  controllers/        request handlers
  routes/             Express routers
  data/userStore.js   user storage (in-memory, TODO: MongoDB)
  utils/mailer.js     reset emails (SMTP or console)
  middleware/         error handling, requireAuth / requireRole
  app.js / server.js  Express app + entry point
client/src/
  api.js              axios instance
  App.jsx             routes (opens on /login)
  context/            AuthContext (current user, login, logout)
  components/         Logo, AuthLayout, Field, ProtectedRoute
  pages/              Login, Register, ForgotPassword, ResetPassword, RoleHome
  styles/             auth.css, shell.css (CSS Grid, responsive)
```

## Log in (story: U1)
The app opens on the login page. Demo accounts (re-created on every server start):

| Role | Email | Password | Home screen |
|---|---|---|---|
| User | user@demo.com | Password123! | /home |
| Moderator | moderator@demo.com | Password123! | /moderator |
| Administrator | admin@demo.com | Password123! | /admin |

- **Register**: creates a regular user; duplicate emails are rejected (409).
- **Lockout**: 5 wrong passwords lock the account for 5 minutes (423 + countdown in the UI).
- **Forgot password**: emails a reset link valid for 15 min. With no `SMTP_HOST` in `server/.env`, the link is printed in the server terminal.
- **Sessions**: httpOnly cookie `sid` (express-session); logout destroys the session.

> **TODO(database):** users and sessions are stored **in memory** for now and are lost on restart.
> Search the code for `TODO(database)`. The main spot is `server/src/data/userStore.js`, which lists the
> suggested Mongoose `User` schema and the Mongoose call to use for each function.

## API
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | `{ name, email, password }` |
| POST | /api/auth/login | `{ email, password }` → sets session cookie |
| POST | /api/auth/logout | ends session |
| GET | /api/auth/me | current user (401 if not logged in) |
| POST | /api/auth/forgot-password | `{ email }` → sends reset link |
| POST | /api/auth/reset-password | `{ token, password }` |
| GET | /api/health | health check |
| GET | /api/posts | list posts |
| POST | /api/posts | create post `{ title, body, author? }` |
