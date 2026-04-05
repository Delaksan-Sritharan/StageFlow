# StageFlow

StageFlow is an open source speaker timer and session manager for Toastmasters clubs, classrooms, and live speaking events.

The first slice of the MVP includes:

- a production-style timer component with start, pause, and reset controls
- a dedicated timer route for live session use
- shared domain types for sessions, speakers, and feedback
- a Supabase client scaffold for the upcoming persistence work

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Supabase

## Getting started

Install dependencies and start the development server:

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Environment

Create a local environment file from `.env.example` when you are ready to connect Supabase:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Current routes

- `/login` log in with Supabase Auth
- `/signup` sign up with email and password
- `/invite/[token]` invited participant join page with auth redirect and role acceptance
- `/` overview page with timer preview and roadmap
- `/timer` dedicated timer mode
- `/session/create` session creation form with Supabase save and redirect
- `/session/[id]` session detail page backed by Supabase
- `/session/[id]/summary` session summary page showing speakers and feedback

## Database setup

Run the checked-in schema for sessions in the Supabase SQL editor:

```bash
supabase/sessions.sql
```

The schema now also provisions authentication support:

- `public.users` synced from `auth.users`
- authenticated ownership policies for sessions, speakers, and feedback
- invite lookup and acceptance RPC helpers for participant join links

If invite links are the only missing piece in an existing database, you can run:

```bash
supabase/enable-invite-join-links.sql
```

## Deployment

Deploy on Vercel:

1. Push the repository to GitHub.
2. In Vercel, choose `Add New Project` and import the repository.
3. Set these environment variables in the Vercel project settings:
   `NEXT_PUBLIC_SUPABASE_URL`
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
4. Keep the default build command: `next build`.
5. Keep the default output setting detected by Vercel for Next.js.
6. Deploy the project.
7. After the first deploy, run the SQL in `supabase/sessions.sql` for the production Supabase project if you have not already.

## Next implementation steps

1. Add editing and deletion for sessions, speakers, and feedback.
2. Connect speaker timing presets to the live timer route.
3. Build a dedicated session summary view from the stored feedback.
4. Add authentication before enabling write access beyond the prototype stage.

## Validation

Run linting with:

```bash
npm run lint
```
