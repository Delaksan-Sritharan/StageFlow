import Link from "next/link";

import { Timer } from "@/components/Timer";

const features = [
  {
    title: "Speaker Timer",
    description:
      "Run polished green, yellow, and red speaking timers with simple controls that work well on stage.",
  },
  {
    title: "Session Management",
    description:
      "Create sessions, organize speakers, and keep every speaking slot visible in one clean workspace.",
  },
  {
    title: "Role-based Invitations",
    description:
      "Invite speakers and evaluators with structured roles so the right people land in the right session flow.",
  },
  {
    title: "Feedback Tracking",
    description:
      "Capture evaluations as the session happens and keep a reliable record for post-session review.",
  },
];

export function LandingPage() {
  return (
    <main className="bg-white text-black">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center px-6 py-14 md:px-10 md:py-20">
        <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-black/45">
                StageFlow
              </p>
              <h1 className="text-5xl font-semibold tracking-[-0.08em] text-black md:text-7xl">
                Run speaking sessions effortlessly
              </h1>
              <p className="max-w-2xl text-base leading-8 text-black/62 md:text-lg">
                A focused workspace for live speaking events with timing,
                invitations, feedback, and session structure in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <Link
                href="#timer-demo"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
              >
                Try Demo
              </Link>
            </div>
          </div>

          <section className="rounded-4xl border border-black/8 bg-white p-6 shadow-[0_28px_100px_rgba(15,23,42,0.08)] md:p-8">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                  Live preview
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-black">
                  Timer demo for public visitors
                </h2>
                <p className="mt-2 text-sm leading-7 text-black/58">
                  Try the session timer directly on the landing page before you
                  create your first account.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f8f8f8_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:p-5">
                <Timer minTime={30} maxTime={60} className="max-w-none" />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section
        id="timer-demo"
        className="border-y border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)]"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-6 py-16 text-center md:px-10 md:py-20">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
              Interactive Timer
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-5xl">
              See the session timer in action
            </h2>
            <p className="text-base leading-8 text-black/62">
              Start, pause, and reset a short speaking timer with a thirty to
              sixty second target window.
            </p>
          </div>

          <div className="w-full max-w-5xl rounded-4xl border border-black/8 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.08)] md:p-8">
            <Timer minTime={30} maxTime={60} className="max-w-none" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-20">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
            Features
          </p>
          <h2 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-5xl">
            Built for live speaking workflows
          </h2>
          <p className="text-base leading-8 text-black/62">
            Everything stays minimal and focused so you can run sessions without
            fighting the software.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
            >
              <p className="text-lg font-semibold tracking-[-0.03em] text-black">
                {feature.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-black/60">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-black/8 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 py-16 text-center md:px-10 md:py-20">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
              Start Now
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-5xl">
              Start your first session today
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-8 text-black/62">
              Create your account and launch a clean speaking-session workflow
              in minutes.
            </p>
          </div>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Create your account
          </Link>
        </div>
      </section>
    </main>
  );
}
