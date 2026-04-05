import Link from "next/link";
import { cookies } from "next/headers";

import { Timer } from "@/components/Timer";
import { createClient } from "@/utils/supabase/server";

function isMissingSessionsTable(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes("Could not find the table 'public.sessions'")
  );
}

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, title, date")
    .order("date", { ascending: true });
  const showSetupState = isMissingSessionsTable(error);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <section className="overflow-hidden rounded-4xl border border-black/8 bg-white/82 px-6 py-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:px-10 md:py-12">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/45">
                StageFlow / Overview
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.07em] text-black md:text-6xl">
                Run live speaking sessions with a calmer workflow.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-black/65 md:text-lg">
                Create sessions, manage speakers, collect feedback, and keep
                timing visible without losing the room.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/session/create"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Create session
              </Link>
              <Link
                href="/timer"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
              >
                Open timer mode
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border border-black/8 bg-white/84 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.05)]">
            <Timer minTime={60} maxTime={90} className="max-w-none" />
          </div>
        </div>
      </section>

      <section className="rounded-4xl border border-black/8 bg-white/84 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
              Sessions
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-black">
              Upcoming and active sessions
            </h2>
          </div>
          <p className="text-sm text-black/55">
            {sessions?.length ?? 0} saved{" "}
            {sessions?.length === 1 ? "session" : "sessions"}
          </p>
        </div>

        {showSetupState ? (
          <section className="mt-6 space-y-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-950">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-black">
                The sessions table is not set up yet.
              </h3>
              <p className="leading-7 text-black/70">
                Run the checked-in schema in supabase/sessions.sql, then refresh
                this page.
              </p>
            </div>
          </section>
        ) : error ? (
          <p className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Failed to load sessions: {error.message}
          </p>
        ) : sessions && sessions.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-4xl border border-black/8 bg-white/88 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/42">
                  Session
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-black">
                  {session.title}
                </h3>
                <p className="mt-2 text-sm text-black/62">
                  {new Date(`${session.date}T00:00:00`).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/session/${session.id}`}
                    className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Open session
                  </Link>
                  <Link
                    href={`/session/${session.id}/summary`}
                    className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
                  >
                    View summary
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-6 rounded-4xl border border-dashed border-black/12 bg-white/75 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-black">
              No sessions yet.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/62">
              Create your first session to start adding speakers, collecting
              feedback, and generating a summary for live use.
            </p>
            <div className="mt-5 flex justify-center">
              <Link
                href="/session/create"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Create first session
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
