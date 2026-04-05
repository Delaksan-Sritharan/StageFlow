import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center px-6 py-10 md:px-10 md:py-14">
      <section className="grid w-full gap-8 overflow-hidden rounded-4xl border border-black/8 bg-white/84 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:grid-cols-[1fr_0.92fr] md:p-10">
        <div className="flex flex-col justify-between gap-8 rounded-4xl bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,245,239,0.92))] p-6 md:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/45">
              StageFlow / Sign Up
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-black md:text-5xl">
              Create your StageFlow account.
            </h1>
            <p className="max-w-xl text-base leading-7 text-black/62">
              Sign up with email and password, add an optional display name, and
              start managing sessions in your own private workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
            >
              Back to login
            </Link>
          </div>
        </div>

        <div className="rounded-4xl border border-black/8 bg-white/88 p-6 md:p-8">
          <AuthForm mode="signup" />
        </div>
      </section>
    </main>
  );
}
