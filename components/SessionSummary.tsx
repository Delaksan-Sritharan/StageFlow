import type { Feedback, Speaker } from "@/types";

type SessionSummaryProps = {
  speakers: Speaker[];
  feedbackBySpeaker: Map<string, Feedback[]>;
  authorLabels: Record<string, string>;
};

function avg(values: number[]) {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function scoreColor(n: number) {
  if (n <= 4) return { bar: "bg-rose-400", text: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
  if (n <= 7) return { bar: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  return { bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function AvatarPill({ name }: { name: string }) {
  const letters = initials(name);
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/8 text-[11px] font-semibold text-black/65">
      {letters}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const { bar, text } = scoreColor(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-black/50">{label}</span>
        <span className={`text-xs font-semibold tabular-nums ${text}`}>{value}/10</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/6">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const { text, bg } = scoreColor(value);
  return (
    <div className={`rounded-2xl border px-3 py-2 text-center ${bg}`}>
      <p className={`text-lg font-semibold tabular-nums leading-none ${text}`}>{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-black/45">{label}</p>
    </div>
  );
}

function AvgBadge({ label, value }: { label: string; value: number | null }) {
  const { text, bg } = value !== null ? scoreColor(value) : { text: "text-black/40", bg: "bg-black/4 border-black/8" };
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${bg}`}>
      <p className={`text-2xl font-semibold tabular-nums leading-none ${text}`}>
        {value !== null ? value : "—"}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
        {label}
      </p>
    </div>
  );
}

export function SessionSummary({
  speakers,
  feedbackBySpeaker,
  authorLabels,
}: SessionSummaryProps) {
  if (speakers.length === 0) {
    return (
      <section className="rounded-4xl border border-dashed border-black/12 bg-white/84 p-12 text-center shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
        <p className="text-4xl">🎤</p>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-black">
          No speakers yet
        </h2>
        <p className="mt-2 text-sm leading-7 text-black/55">
          Add speakers on the session page, then return here for a full summary.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {speakers.map((speaker) => {
        const feedback = feedbackBySpeaker.get(speaker.id) ?? [];
        const avgContent = avg(feedback.map((f) => f.contentScore));
        const avgDelivery = avg(feedback.map((f) => f.deliveryScore));
        const avgConfidence = avg(feedback.map((f) => f.confidenceScore));
        const overallAvg =
          avgContent !== null && avgDelivery !== null && avgConfidence !== null
            ? avg([avgContent, avgDelivery, avgConfidence])
            : null;

        return (
          <article
            key={speaker.id}
            className="overflow-hidden rounded-4xl border border-black/8 bg-white/88 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur"
          >
            {/* Speaker header */}
            <div className="flex flex-col gap-4 border-b border-black/8 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/6 text-sm font-semibold text-black/55">
                  {initials(speaker.name)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-black">
                    {speaker.name}
                  </h2>
                  <p className="text-sm text-black/50">{speaker.role}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-black/3 px-3 py-1.5 text-xs font-medium text-black/55">
                {feedback.length} {feedback.length === 1 ? "response" : "responses"}
              </span>
            </div>

            {feedback.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-black/45">
                No feedback submitted for this speaker yet.
              </div>
            ) : (
              <>
                {/* Average scores */}
                <div className="border-b border-black/8 bg-black/[0.015] px-6 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-black/38">
                    Averages
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <AvgBadge label="Overall" value={overallAvg} />
                    <AvgBadge label="Content" value={avgContent} />
                    <AvgBadge label="Delivery" value={avgDelivery} />
                    <AvgBadge label="Confidence" value={avgConfidence} />
                  </div>
                </div>

                {/* Individual feedback */}
                <div className="divide-y divide-black/6 px-6">
                  {feedback.map((entry) => {
                    const authorName = entry.userId
                      ? (authorLabels[entry.userId] ?? "Participant")
                      : "Anonymous";

                    return (
                      <div key={entry.id} className="py-5">
                        {/* Reviewer */}
                        <div className="mb-4 flex items-center gap-2.5">
                          <AvatarPill name={authorName} />
                          <div>
                            <p className="text-sm font-semibold text-black">
                              {authorName}
                            </p>
                            {entry.createdAt ? (
                              <p className="text-xs text-black/38">
                                {new Date(entry.createdAt).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" },
                                )}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Score badges */}
                        <div className="mb-4 grid grid-cols-3 gap-2">
                          <ScoreBadge label="Content" value={entry.contentScore} />
                          <ScoreBadge label="Delivery" value={entry.deliveryScore} />
                          <ScoreBadge label="Confidence" value={entry.confidenceScore} />
                        </div>

                        {/* Score bars */}
                        <div className="mb-4 space-y-2.5">
                          <ScoreBar label="Content" value={entry.contentScore} />
                          <ScoreBar label="Delivery" value={entry.deliveryScore} />
                          <ScoreBar label="Confidence" value={entry.confidenceScore} />
                        </div>

                        {/* Comment */}
                        {entry.comment ? (
                          <p className="rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3 text-sm leading-7 text-black/68">
                            {entry.comment}
                          </p>
                        ) : (
                          <p className="text-xs italic text-black/35">No comment provided.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
