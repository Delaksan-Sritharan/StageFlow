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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Current routes

- `/` overview page with timer preview and roadmap
- `/timer` dedicated timer mode
- `/session/create` scaffold for session creation
- `/session/[id]` scaffold for session detail

## Next implementation steps

1. Create the Supabase schema for sessions, speakers, and feedback.
2. Build the session creation flow and list view.
3. Add speaker management and per-speaker timing presets.
4. Store and display feedback in the session summary.

## Validation

Run linting with:

```bash
npm run lint
```
