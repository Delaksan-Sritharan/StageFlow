# StageFlow

StageFlow is an open source speaker timer and session manager for Toastmasters clubs, classrooms, and live speaking events. It supports real-time timer synchronisation across multiple attendees, structured feedback collection, and role-based session management.

## Features

- **Live session workspace** — real-time timer visible to all participants, started and controlled by the session creator or the assigned evaluator
- **Synchronised timer** — timer state is persisted in Supabase and broadcast via real-time channels, so every participant sees the same running clock without refreshing
- **Role-based timer control** — only the session creator and evaluators can start, pause, or reset the timer; speakers see the timer and who started it but cannot control it
- **Finish speaker flow** — marking a speaker as finished is synced to all participants and unlocks the feedback form for that speaker
- **Feedback forms** — visual 1–10 score picker for content, delivery, and confidence; colour-coded (red / amber / green); auto-resets after successful submission with a toast confirmation
- **Speaker self-feedback blocked** — speakers cannot submit feedback for their own speech on both the client and server
- **Evaluation modes** — open mode (anyone can give feedback) and assigned mode (only the designated evaluator for each speaker)
- **Invite system** — email invitations and shareable link invitations with QR code download; generated links are displayed as full absolute URLs (e.g. `https://your-domain.com/invite/<token>`); invitees choose to accept or reject before joining
- **Real-time data updates** — feedback, speaker, and participant changes from other users appear automatically without a manual refresh
- **Session summary** — aggregated feedback view for session creators

## Stack

- Next.js App Router (React Server Components + Server Actions)
- React 19
- Tailwind CSS 4
- Supabase (Postgres, Auth, Realtime)

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Environment

Copy the example environment file and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Database setup

Run the migrations in order in the Supabase SQL editor.

### Full setup (new project)

```
supabase/sessions.sql
```

This creates all core tables (`sessions`, `session_participants`, `speakers`, `feedback`, `users`), RLS policies, and RPC helpers for invite token lookup and acceptance.

### Real-time timer sync (required for live timer)

```
supabase/enable-realtime-timer.sql
```

Creates the `speaker_timer_states` table, attaches RLS policies so only creators and evaluators can write timer state, and adds the table to the `supabase_realtime` publication so timer changes broadcast to all connected clients instantly.

### Assigned evaluation mode (optional)

```
supabase/enable-assigned-evaluation-mode.sql
```

Adds the `assigned_evaluator_participant_id` column to `speakers` if it is missing.

### Invite join links (optional, existing databases)

```
supabase/enable-invite-join-links.sql
```

Adds invite token support and the `get_session_invitation` RPC to an existing database.

### Policy repair (existing databases with RLS issues)

```
supabase/fix-session-participant-policies.sql
```

Fixes infinite recursion or broken policies on `session_participants` without recreating tables.

## Routes

| Route | Description |
|---|---|
| `/` | Landing page with timer preview |
| `/login` | Sign in with Supabase Auth |
| `/signup` | Create an account |
| `/session/create` | Create a new session |
| `/session/[id]` | Live session — timer, feedback, speaker management, invitations |
| `/session/[id]/summary` | Aggregated feedback summary (creator only) |
| `/invite/[token]` | Invitation acceptance page; link displayed as full URL derived from request origin |
| `/timer` | Standalone timer demo |

## Session roles

| Role | Timer control | Give feedback | Finish speaker |
|---|---|---|---|
| Session creator | Yes | Yes | Yes |
| Evaluator | Yes | Yes (not own speech) | Yes |
| Speaker | No (view only) | No (own speech blocked) | No |
| Observer | No | Yes in open mode | No |

## Deployment

1. Push the repository to GitHub.
2. In Vercel, choose **Add New Project** and import the repository.
3. Set these environment variables in the project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Keep the default build command: `next build`.
5. Deploy the project.
6. After the first deploy, run the SQL migrations in order against your production Supabase project.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide on opening issues, getting assigned, and submitting pull requests.

## Validation

```bash
npm run lint
```
