# Community Discussion (MERN)

A community discussion web app where users, moderators and administrators can log in and talk things through.

- **M**ongoDB: database (planned; see [status](#project-status))
- **E**xpress + **N**ode.js: REST API in `server/` (port 5001)
- **R**eact (Vite): web frontend in `client/` (port 5173)

> **New to the project?** Read [`docs/Developer_Handover_Guide.docx`](docs/Developer_Handover_Guide.docx) before building a new page. It lists the setup and fixes still needed (database, models, controllers), with exact files, line numbers and code.

## Quick start
Requires **Node.js 20+** (built with Node 24).

```bash
git clone https://github.com/Minh3782/Community_Discussion.git
cd Community_Discussion
npm run install:all                   # installs root, server and client packages
cp server/.env.example server/.env    # then set SESSION_SECRET (see below)
npm run dev                           # starts API + frontend together
```

Open http://localhost:5173. The app opens on the login page.

`SESSION_SECRET` must be a long random string, e.g. the output of `openssl rand -hex 32`. The server will not start without it. **Never commit `server/.env`** (it is in `.gitignore`).

The Vite dev server forwards `/api/*` to the Express server, so the browser sees one origin. Port 5001 is used because macOS reserves 5000; if you change `PORT`, also change the proxy in `client/vite.config.js`.

## Scripts (project root)
| Command | What it does |
|---|---|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Run API and frontend together |
| `npm run server` / `npm run client` | Run just one of them |
| `npm run build` | Production build of the frontend (`client/dist`) |
| `npm run lint --prefix client` | Lint the frontend (oxlint) |

## Project status
| Area | Status |
|---|---|
| Log In story (U1): register, log in/out, forgot/reset password, lockout | Done |
| Role home screens (`/home`, `/moderator`, `/admin`) | Placeholders ("Coming soon" cards, menu links not wired) |
| **User database** | **Not done**: users live in memory and are lost on restart |
| **Session storage** | **Not done**: express-session MemoryStore |
| Posts API (`/api/posts`) | Sample only: **not protected**, must be secured before use |
| Automated tests | None yet |

Search the code for `TODO(database)` to find every spot that changes when MongoDB is added. Step-by-step instructions are in the handover guide (Section 5).

## Log in (story U1)
Demo accounts, re-created on every server start (until the seed script in the handover guide replaces this):

| Role | Email | Password | Home screen |
|---|---|---|---|
| User | user@demo.com | Password123! | /home |
| Moderator | moderator@demo.com | Password123! | /moderator |
| Administrator | admin@demo.com | Password123! | /admin |

- **Register**: creates a regular user; duplicate emails are rejected (409). Moderators/admins cannot self-register.
- **Lockout**: 5 wrong passwords lock the account for 5 minutes (423 + countdown in the UI).
- **Forgot password**: emails a one-time reset link valid for 15 minutes. With no `SMTP_HOST` in `server/.env`, the email is printed in the server terminal instead.
- **Sessions**: httpOnly cookie `sid` (express-session); logout destroys the session.

## Structure
```
server/src/
  server.js / app.js  entry point + Express app (sessions, routes, errors)
  config/db.js        MongoDB connection
  data/userStore.js   user storage (in-memory, TODO: MongoDB)
  models/             Mongoose schemas (Post; User still to create)
  controllers/        request handlers (auth, posts)
  routes/             Express routers
  middleware/         error handling, requireAuth / requireRole
  utils/mailer.js     reset emails (SMTP or console)
client/src/
  App.jsx             routes (opens on /login)
  api.js              axios instance + errorMessage()
  context/            AuthContext (current user, login, logout, ROLE_HOME)
  components/         Logo, AuthLayout, Field, ProtectedRoute
  pages/              Login, Register, ForgotPassword, ResetPassword, RoleHome
  styles/             auth.css, shell.css (CSS Grid, responsive)
docs/
  Developer_Handover_Guide.docx
```

## Design
Minimal, light mode, green theme. Colours, radius and spacing are tokens at the top of `client/src/index.css`. Layouts use CSS Grid with breakpoints at 1000px, 800px and 500px. The logo (two speech bubbles) is in `client/src/components/Logo.jsx` and `client/public/favicon.svg`.

## API
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | `{ name, email, password }` → 201, or 409 if the email exists |
| POST | /api/auth/login | `{ email, password }` → sets session cookie; 401 wrong, 423 locked |
| POST | /api/auth/logout | ends the session |
| GET | /api/auth/me | current user (401 if not logged in) |
| POST | /api/auth/forgot-password | `{ email }` → sends reset link (same reply whether or not the email exists) |
| POST | /api/auth/reset-password | `{ token, password }` |
| GET | /api/health | health check |
| GET / POST | /api/posts | sample only, unprotected (see status) |

## Contributing
Work on a feature branch and open a pull request into `main`:

```bash
git checkout main && git pull
git checkout -b feature/<short-name>
# ...changes...
git push -u origin feature/<short-name>
```

Before opening the pull request, run the linter and re-check the login acceptance tests (handover guide, Section 9). Add any new setting to `server/.env.example` with a dummy value.
