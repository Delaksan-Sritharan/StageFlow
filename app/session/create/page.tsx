import Link from "next/link";

import { SessionCreateForm } from "@/components/SessionCreateForm";

export default function CreateSessionPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 md:px-10">
      <section className="rounded-4xl border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
              StageFlow / Sessions
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black">
                Create session
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/65">
                Create a session with a title and date, save it to Supabase, and
                continue directly to the session page.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
          >
            Back to overview
          </Link>
        </div>
      </section>

      <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
        <SessionCreateForm />
      </section>
    </main>
  );
}
