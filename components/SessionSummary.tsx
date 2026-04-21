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

function scoreTheme(n: number) {
  if (n <= 4)
    return {
      pill: "border-rose-200/70 bg-rose-50 text-rose-600",
      bar: "bg-rose-400",
      text: "text-rose-600",
    };
  if (n <= 7)
    return {
      pill: "border-amber-200/70 bg-amber-50 text-amber-600",
      bar: "bg-amber-400",
      text: "text-amber-600",
    };
  return {
    pill: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/38">
            {label}
          </span>
          <span className="font-mono text-sm font-semibold text-black/22">—</span>
        </div>
        <div className="h-1 rounded-full bg-black/6" />
      </div>
    );
  }

  const theme = scoreTheme(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/42">
          {label}
        </span>
        <span className={`font-mono text-sm font-semibold tabular-nums ${theme.text}`}>
          {value}
          <span className="font-normal text-black/28">/10</span>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-black/6">
        <div
          className={`h-full rounded-full ${theme.bar}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ScorePip({ label, value }: { label: string; value: number }) {
  const theme = scoreTheme(value);
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${theme.pill} px-2.5 py-1 text-xs`}
    >
      <span className="font-medium text-black/40">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
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
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-black/3">
            <svg
              className="h-4 w-4 text-black/32"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/40">
              Summary
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-black">
              No speakers yet
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-black/52">
              Add speakers on the session page, then return here for a full
              summary of scores and comments.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const totalResponses = speakers.reduce(
    (sum, s) => sum + (feedbackBySpeaker.get(s.id)?.length ?? 0),
    0,
  );

  const overallContent = avg(
    speakers.flatMap(
      (s) => feedbackBySpeaker.get(s.id)?.map((f) => f.contentScore) ?? [],
    ),
  );
  const overallDelivery = avg(
    speakers.flatMap(
      (s) => feedbackBySpeaker.get(s.id)?.map((f) => f.deliveryScore) ?? [],
    ),
  );
  const overallConfidence = avg(
    speakers.flatMap(
      (s) => feedbackBySpeaker.get(s.id)?.map((f) => f.confidenceScore) ?? [],
    ),
  );

  return (
    <div className="space-y-5">
      {/* Session-level overview */}
      {totalResponses > 0 && (
        <section className="overflow-hidden rounded-4xl border border-black/8 bg-white/80 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-black/40">
                Session overview
              </p>
              <p className="mt-1 text-sm text-black/52">
                {speakers.length}{" "}
                {speakers.length === 1 ? "speaker" : "speakers"} &middot;{" "}
                {totalResponses}{" "}
                {totalResponses === 1 ? "response" : "responses"} collected
              </p>
            </div>

            <div className="flex divide-x divide-black/[0.07] overflow-hidden rounded-2xl border border-black/[0.07]">
              {(
                [
                  ["Content", overallContent],
                  ["Delivery", overallDelivery],
                  ["Confidence", overallConfidence],
                ] as [string, number | null][]
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-white/60 px-5 py-3.5"
                >
                  <span
                    className={`font-mono text-lg font-semibold tabular-nums leading-none ${val !== null ? scoreTheme(val).text : "text-black/22"}`}
                  >
                    {val ?? "—"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Per-speaker cards */}
      {speakers.map((speaker, speakerIndex) => {
        const feedback = feedbackBySpeaker.get(speaker.id) ?? [];
        const avgContent = avg(feedback.map((f) => f.contentScore));
        const avgDelivery = avg(feedback.map((f) => f.deliveryScore));
        const avgConfidence = avg(feedback.map((f) => f.confidenceScore));

        return (
          <article
            key={speaker.id}
            className="overflow-hidden rounded-4xl border border-black/8 bg-white/84 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur"
          >
            {/* Speaker header */}
            <div className="flex flex-col gap-5 p-7 md:flex-row md:items-start md:gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-black/3 text-sm font-semibold text-black/50">
                  {initials(speaker.name)}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">
                    Speaker {speakerIndex + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-black">
                    {speaker.name}
                  </h2>
                  {speaker.role ? (
                    <p className="mt-0.5 text-sm text-black/50">{speaker.role}</p>
                  ) : null}
                </div>
              </div>

              <div className="md:ml-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-black/2 px-3.5 py-1.5">
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-black/32"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-black/50">
                    {feedback.length}{" "}
                    {feedback.length === 1 ? "response" : "responses"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mx-7 border-t border-black/6" />

            {/* Averages */}
            {feedback.length > 0 ? (
              <div className="p-7 pb-6">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">
                  Score averages
                </p>
                <div className="grid gap-5 sm:grid-cols-3">
                  <ScoreBar label="Content" value={avgContent} />
                  <ScoreBar label="Delivery" value={avgDelivery} />
                  <ScoreBar label="Confidence" value={avgConfidence} />
                </div>
              </div>
            ) : (
              <div className="px-7 py-6">
                <div className="flex items-center gap-3 rounded-2xl border border-black/6 bg-black/1.5 px-4 py-3.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-black/18" />
                  <p className="text-sm text-black/42">
                    No feedback submitted for this speaker yet.
                  </p>
                </div>
              </div>
            )}

            {/* Individual entries */}
            {feedback.length > 0 && (
              <>
                <div className="mx-7 border-t border-black/6" />
                <div className="p-7 pt-5">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">
                    Individual responses
                  </p>
                  <div className="space-y-2.5">
                    {feedback.map((entry) => {
                      const authorName = entry.userId
                        ? (authorLabels[entry.userId] ?? "Participant")
                        : "Anonymous";

                      return (
                        <div
                          key={entry.id}
                          className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white/70"
                        >
                          {/* Reviewer row */}
                          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/8 bg-black/4 text-[10px] font-semibold text-black/48">
                                {initials(authorName)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold leading-none text-black/82">
                                  {authorName}
                                </p>
                                {entry.createdAt ? (
                                  <p className="mt-1 text-[11px] text-black/32">
                                    {new Date(
                                      entry.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:shrink-0">
                              <ScorePip label="Content" value={entry.contentScore} />
                              <ScorePip label="Delivery" value={entry.deliveryScore} />
                              <ScorePip label="Confidence" value={entry.confidenceScore} />
                            </div>
                          </div>

                          {entry.comment ? (
                            <>
                              <div className="mx-5 border-t border-black/5" />
                              <div className="flex items-start gap-3.5 px-5 py-4">
                                <div className="mt-0.5 w-0.5 self-stretch rounded-full bg-black/9" />
                                <p className="text-sm leading-[1.65] text-black/60">
                                  {entry.comment}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="mx-5 border-t border-black/5" />
                              <div className="flex items-center gap-3.5 px-5 py-3.5">
                                <div className="w-0.5 self-stretch rounded-full bg-black/[0.06]" />
                                <p className="text-xs italic text-black/28">
                                  No comment provided.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
