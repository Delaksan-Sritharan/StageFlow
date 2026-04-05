import Link from "next/link";

import { Timer } from "@/components/Timer";

export default function TimerPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 md:px-10 md:py-14">
      <header className="flex flex-col gap-5 rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
              StageFlow / Timer
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-black md:text-5xl">
              Focused timer mode for live sessions.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-black/65">
              This isolated timer route is the first production slice of StageFlow. It is ready for manual testing on desktop and mobile before the session workflow is added.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/[0.03]"
          >
            Back to overview
          </Link>
        </div>
      </header>

      <Timer
        speakerName="Aisha Carter"
        role="Prepared Speech"
        minTimeSeconds={300}
        maxTimeSeconds={420}
      />
    </main>
  );
}