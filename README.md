# Community Discussion (MERN)

A community discussion web app where users, moderators and administrators can log in, join communities and talk things through.

- **M**ongoDB: database (Mongoose models in `server/src/models/`)
- **E**xpress + **N**ode.js: REST API in `server/` (port 5001)
- **R**eact (Vite): web frontend in `client/` (port 5173)

> **New to the project?** [`docs/Developer_Handover_Guide.docx`](docs/Developer_Handover_Guide.docx) explains the setup and conventions. It was written on 12 November 2026; several of its "to do" steps have since been completed (see [Project status](#project-status)).

## Quick start
Requires **Node.js 20+** (built with Node 24) and a MongoDB database.

```bash
git clone https://github.com/Minh3782/Community_Discussion.git
cd Community_Discussion
npm run install:all                   # installs root, server and client packages
cp server/.env.example server/.env    # then set SESSION_SECRET and MONGO_URI (see below)
npm run dev                           # starts API + frontend together
```

Open http://localhost:5173. The app opens on the login page.

- `SESSION_SECRET` must be a long random string, e.g. the output of `openssl rand -hex 32`.
- `MONGO_URI` is your database: a local MongoDB (`mongodb://127.0.0.1:27017/community_discussion`) or the team's MongoDB Atlas connection string.
- The server will not start without either of them. **Never commit `server/.env`** (it is in `.gitignore`).

The Vite dev server forwards `/api/*` to the Express server, so the browser sees one origin. Port 5001 is used because macOS reserves 5000; if you change `PORT`, also change the proxy in `client/vite.config.js`.

## Scripts (project root)
| Command | What it does |
|---|---|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Run API and frontend together |
| `npm run server` / `npm run client` | Run just one of them |
| `npm run build` | Production build of the frontend (`client/dist`) |
| `npm run lint --prefix client` | Lint the frontend (oxlint) |
| `npm run seed:discussions --prefix server` | Add a "Test Community" with 3 test discussions (safe to re-run) |

## Project status
Iteration 1 stories:

| Story | Status |
|---|---|
| C1 Log in and registration: register, log in/out, forgot/reset password, 5-minute lockout | Done |
| A1 Manage communities and moderators (`/admin/communities`) | Done |
| U1 Browse and join communities | API done (list, view, join, leave). Community page with rules and Join/Leave buttons not built yet |
| U3 Start a discussion (`/discussions`, `/discussions/new`) | Done |
| U4 Create a post | API done. Create-post form and post list screens not built yet |
| U5 View a discussion | Post ordering API done. Discussion page not built yet |

Platform:

| Area | Status |
|---|---|
| User database | Done (MongoDB) |
| Shared app layout and menu (`AppShell`) | Done. Menu items for pages not built yet are greyed out |
| Session storage | **Not done**: express-session MemoryStore, so everyone is logged out when the server restarts. See `TODO(database)` in `server/src/app.js` and handover guide step 5.5 |
| Automated tests | None in the repo yet |

## Log in (story C1)
Demo accounts, created when the server starts if they do not exist yet:

| Role | Name | Email | Password | Home screen |
|---|---|---|---|---|
| User | Emma User | user@demo.com | Password123! | /home |
| Moderator | Mark Moderator | moderator@demo.com | Password123! | /moderator |
| Administrator | Alice Admin | admin@demo.com | Password123! | /admin |

- **Register**: creates a regular user; duplicate emails are rejected (409), in any letter case. Moderators/admins cannot self-register.
- **Lockout**: 5 wrong passwords lock the account for 5 minutes (423 + countdown in the UI).
- **Forgot password**: emails a one-time reset link valid for 15 minutes. With no `SMTP_HOST` in `server/.env`, the email is printed in the server terminal instead.
- **Sessions**: httpOnly cookie `sid` (express-session); logout destroys the session.

## Structure
```
server/
  scripts/seedDiscussions.js  test community + discussions (npm run seed:discussions)
  src/
    server.js / app.js  entry point + Express app (sessions, routes, errors)
    config/db.js        MongoDB connection (server stops if it fails)
    data/userStore.js   user lookups used by auth + demo account seeding
    models/             User, Community, Membership, Discussion, Post
    controllers/        auth, adminCommunity, community, membership, post
    routes/             Express routers (auth, admin, communities, posts)
    middleware/         error handling, requireAuth (loads req.user) / requireRole
    utils/              httpError (status + message), mailer (SMTP or console)
client/src/
  App.jsx             routes (opens on /login)
  api.js              axios instance + errorMessage()
  roles.js            role display names
  context/            AuthContext (current user, login, logout, ROLE_HOME)
  components/         AppShell (header + menu), AuthLayout, Field, Logo, ProtectedRoute
  pages/              Login, Register, ForgotPassword, ResetPassword, RoleHome,
                      AdminCommunities, Discussions, NewDiscussion
  styles/             auth, shell, admin-communities, discussions (CSS Grid, responsive)
docs/
  Developer_Handover_Guide.docx
```

## Design
Minimal, light mode, green theme. Colours, radius and spacing are tokens at the top of `client/src/index.css`. Layouts use CSS Grid with breakpoints at 1000px, 800px and 500px. Every logged-in page renders inside `AppShell`, which draws the header and the role menu; add new pages to its `NAV` list. The logo (two speech bubbles) is in `client/src/components/Logo.jsx` and `client/public/favicon.svg`.

## API
All routes except auth and health require a logged-in session (401 otherwise). Invalid IDs return 400, unknown IDs 404.

**Auth (C1)**

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | `{ name, email, password }` → 201, 400 invalid, 409 if the email exists |
| POST | /api/auth/login | `{ email, password }` → sets session cookie; 401 wrong, 423 locked |
| POST | /api/auth/logout | ends the session |
| GET | /api/auth/me | current user (401 if not logged in) |
| POST | /api/auth/forgot-password | `{ email }` → sends reset link (same reply whether or not the email exists) |
| POST | /api/auth/reset-password | `{ token, password }` |
| GET | /api/health | health check |

**Admin (A1, administrators only, 403 for other roles)**

| Method | Path | Description |
|---|---|---|
| GET | /api/admin/communities | communities with their moderators |
| POST | /api/admin/communities | `{ name, description?, rules? }` → 201, 409 if the name exists |
| GET | /api/admin/moderator-candidates | users with the moderator role |
| PUT | /api/admin/communities/:communityId/moderators/:userId | assign a moderator (400 if the user is not a moderator) |
| DELETE | /api/admin/communities/:communityId | 204; 409 if it has memberships or discussions |

**Communities and discussions (U1, U3)**

| Method | Path | Description |
|---|---|---|
| GET | /api/communities | all communities (name, description, rules) |
| GET | /api/communities/:communityId | one community |
| GET | /api/communities/:communityId/discussions | its discussions, newest first, with creator name |
| POST | /api/communities/:communityId/discussions | `{ title, content }` → 201; 400 if either is missing |
| GET | /api/communities/:communityId/membership | `{ community, member }`: is the logged-in user a member? |
| POST | /api/communities/:communityId/membership | Join. 201 joined, 200 already a member |
| DELETE | /api/communities/:communityId/membership | Leave. 200 `{ member: false }`, also when not a member |

**Posts (U4, U5)**

| Method | Path | Description |
|---|---|---|
| POST | /api/posts | Publish a post; **must be a member of the community** (else 403). `{ title, body, discussionId, communityId? }` → 201 post. 400 with `fields` (per-field messages) if title/body/discussion is missing or invalid, or the discussion is not in `communityId`. Title max 200, body max 10000 characters. Author is always the logged-in user. |
| GET | /api/posts | List posts by timestamp. `?discussionId=` or `?communityId=` (exactly one), `&sort=newest` (default) or `oldest`. Returns up to 100 posts. |

Post shape: `{ id, title, body, author: { id, name }, discussion, community, createdAt, updatedAt }`.

## Contributing
Work on a feature branch and open a pull request into `main`:

```bash
git checkout main && git pull
git checkout -b feature/<short-name>
# ...changes...
git push -u origin feature/<short-name>
```

Before opening the pull request, run the linter and re-check the login acceptance tests (handover guide, Section 9). Add any new setting to `server/.env.example` with a dummy value.
