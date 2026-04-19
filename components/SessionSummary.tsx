import type { Feedback, Speaker } from "@/types";

type SessionSummaryProps = {
  speakers: Speaker[];
  feedbackBySpeaker: Map<string, Feedback[]>;
  authorLabels: Record<string, string>;
};

function avg(values: number[]) {
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function scorePillStyle(n: number) {
  if (n <= 4) return "border-rose-200/70 bg-rose-50 text-rose-600";
  if (n <= 7) return "border-amber-200/70 bg-amber-50 text-amber-600";
  return "border-emerald-200/70 bg-emerald-50 text-emerald-700";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ScorePill({
  label,
  value,
  large,
}: {
  label: string;
  value: number;
  large?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${scorePillStyle(value)} ${large ? "px-4 py-2 text-sm font-semibold" : "px-3 py-1.5 text-sm"}`}
    >
      <span className="text-black/45 font-normal">{label}</span>
      <span className="font-semibold tabular-nums">{value}/10</span>
    </div>
  );
}

function AvgPill({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value === null) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-black/2 px-4 py-2 text-sm">
        <span className="text-black/42">{label}</span>
        <span className="font-semibold tabular-nums text-black/35">—</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${scorePillStyle(value)} px-4 py-2 text-sm`}
    >
      <span className="font-normal text-black/45">{label}</span>
      <span className="font-semibold tabular-nums">{value}/10</span>
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
      <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
          Summary
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-black">
          No speakers yet
        </h2>
        <p className="mt-2 text-sm leading-7 text-black/58">
          Add speakers on the session page, then return here for a full summary
          of scores and comments.
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

        return (
          <article
            key={speaker.id}
            className="rounded-4xl border border-black/8 bg-white/84 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur"
          >
            {/* Speaker header */}
            <div className="flex flex-col gap-4 p-8 pb-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                  Speaker
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                  {speaker.name}
                </h2>
                <p className="text-sm text-black/58">{speaker.role}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="rounded-full border border-black/8 bg-black/2 px-4 py-2 text-sm text-black/58">
                  {feedback.length}{" "}
                  {feedback.length === 1 ? "response" : "responses"}
                </div>
              </div>
            </div>

            {/* Averages */}
            {feedback.length > 0 && (
              <div className="mx-8 mb-6 rounded-3xl border border-black/8 bg-black/[0.018] px-5 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-black/38">
                  Averages across all feedback
                </p>
                <div className="flex flex-wrap gap-2">
                  <AvgPill label="Content" value={avgContent} />
                  <AvgPill label="Delivery" value={avgDelivery} />
                  <AvgPill label="Confidence" value={avgConfidence} />
                </div>
              </div>
            )}

            {/* Feedback entries */}
            {feedback.length === 0 ? (
              <div className="px-8 pb-8">
                <p className="rounded-3xl border border-black/8 bg-white/80 px-4 py-3 text-sm text-black/58">
                  No feedback submitted for this speaker yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3 px-8 pb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/38">
                  All feedback
                </p>
                {feedback.map((entry) => {
                  const authorName = entry.userId
                    ? (authorLabels[entry.userId] ?? "Participant")
                    : "Anonymous";
                  const letters = initials(authorName);

                  return (
                    <article
                      key={entry.id}
                      className="rounded-3xl border border-black/8 bg-white/82 p-5"
                    >
                      {/* Reviewer row */}
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/8 bg-black/4 text-xs font-semibold text-black/55">
                          {letters}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-none text-black">
                            {authorName}
                          </p>
                          {entry.createdAt ? (
                            <p className="mt-1 text-xs text-black/38">
                              {new Date(entry.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        <ScorePill label="Content" value={entry.contentScore} />
                        <ScorePill label="Delivery" value={entry.deliveryScore} />
                        <ScorePill label="Confidence" value={entry.confidenceScore} />
                      </div>

                      {/* Comment */}
                      {entry.comment ? (
                        <p className="text-sm leading-7 text-black/65">
                          {entry.comment}
                        </p>
                      ) : (
                        <p className="text-sm italic text-black/30">
                          No comment provided.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
