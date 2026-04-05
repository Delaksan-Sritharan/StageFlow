import Link from "next/link";

import { deleteSession } from "@/app/dashboard/actions";

type DashboardSessionCardProps = {
  session: {
    id: string;
    title: string;
    date: string;
    userId: string | null;
  };
  participantCount: number;
  isCreator: boolean;
};

export function DashboardSessionCard({
  session,
  participantCount,
  isCreator,
}: DashboardSessionCardProps) {
  return (
    <article className="rounded-4xl border border-black/8 bg-white/88 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/42">
            {isCreator ? "Creator" : "Participant"}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-black">
            {session.title}
          </h3>
          <p className="mt-2 text-sm text-black/62">
            {new Date(`${session.date}T00:00:00`).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="rounded-full border border-black/8 bg-black/2 px-3 py-1.5 text-sm text-black/62">
          {participantCount}{" "}
          {participantCount === 1 ? "participant" : "participants"}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
        {isCreator ? (
          <form action={deleteSession}>
            <input type="hidden" name="sessionId" value={session.id} />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-100"
            >
              Delete session
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
