import Link from "next/link";

import { Timer } from "@/components/Timer";

export default function TimerPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 px-6 py-10 md:px-10 md:py-14">
      <header className="flex w-full flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/45">
          StageFlow / Timer Test
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-black md:text-6xl">
          Reusable timer with threshold-based color states.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-black/62">
          Start the clock, pause it, reset it, and watch the timer move from
          green to yellow to red as it passes the configured limits.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/[0.03]"
        >
          Back to overview
        </Link>
      </header>

      <Timer minTime={60} maxTime={90} />
    </main>
  );
}
