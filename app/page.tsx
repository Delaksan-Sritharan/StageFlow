import Link from "next/link";

import { Timer } from "@/components/Timer";

const roadmap = [
  {
    title: "Session management",
    description:
      "Create sessions with title and date, then keep a clean list ready for live event use.",
  },
  {
    title: "Speaker roster",
    description:
      "Assign speakers, evaluators, and table topics roles with timing windows per speaker.",
  },
  {
    title: "Feedback summary",
    description:
      "Capture scores and comments, then display a concise end-of-session review.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <section className="overflow-hidden rounded-[2rem] border border-black/8 bg-white/82 px-6 py-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:px-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/45">
              Open source speaker timer
            </p>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.07em] text-black md:text-7xl">
                StageFlow keeps live speaking sessions calm, visible, and on
                time.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-black/65 md:text-lg">
                The first MVP slice is focused on a distraction-free timer
                experience and the project structure needed for sessions,
                speakers, feedback, and Supabase-backed persistence.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/timer"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Open timer mode
              </Link>
              <Link
                href="/session/create"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/[0.03]"
              >
                View session scaffold
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.6rem] border border-black/8 bg-black px-5 py-6 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                Current focus
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                Timer + project foundation
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-black/8 bg-white px-5 py-6">
              <p className="text-xs uppercase tracking-[0.24em] text-black/45">
                Data layer
              </p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-black">
                Supabase client scaffolded for sessions and feedback.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-black/8 bg-white px-5 py-6">
              <p className="text-xs uppercase tracking-[0.24em] text-black/45">
                Built for use
              </p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-black">
                Mobile-friendly layouts and low-friction controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Timer
          speakerName="Aisha Carter"
          role="Prepared Speech"
          minTimeSeconds={300}
          maxTimeSeconds={420}
        />

        <section className="rounded-[2rem] border border-black/8 bg-white/84 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
                MVP roadmap
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-black">
                What comes after the timer
              </h2>
            </div>

            <div className="space-y-4">
              {roadmap.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-[1.5rem] border border-black/8 bg-black/[0.02] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-black/40">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-black">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-black/62">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
