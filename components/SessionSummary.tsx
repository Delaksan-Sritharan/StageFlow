import type { Feedback, Speaker } from "@/types";

type SessionSummaryProps = {
  speakers: Speaker[];
  feedbackBySpeaker: Map<string, Feedback[]>;
};

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-black/8 bg-black/2 px-3 py-1.5 text-sm text-black/68">
      {label} {value}/10
    </div>
  );
}

export function SessionSummary({
  speakers,
  feedbackBySpeaker,
}: SessionSummaryProps) {
  if (speakers.length === 0) {
    return (
      <section className="rounded-4xl border border-dashed border-black/12 bg-white/84 p-8 text-center text-sm text-black/65 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-black">
          No speakers yet.
        </h2>
        <p className="mt-3 leading-7 text-black/62">
          Add speakers on the session page first, then return here for a clean
          summary of scores and comments.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {speakers.map((speaker) => {
        const feedback = feedbackBySpeaker.get(speaker.id) ?? [];

        return (
          <article
            key={speaker.id}
            className="rounded-4xl border border-black/8 bg-white/86 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur"
          >
            <div className="flex flex-col gap-2 border-b border-black/8 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-black">
                  {speaker.name}
                </p>
                <p className="mt-1 text-sm text-black/58">{speaker.role}</p>
              </div>
              <div className="text-sm text-black/52">
                {feedback.length} feedback{" "}
                {feedback.length === 1 ? "entry" : "entries"}
              </div>
            </div>

            {feedback.length === 0 ? (
              <p className="pt-4 text-sm text-black/62">
                No feedback submitted yet.
              </p>
            ) : (
              <div className="space-y-4 pt-4">
                {feedback.map((entry) => (
                  <section
                    key={entry.id}
                    className="rounded-3xl border border-black/8 bg-white/80 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <ScorePill label="Content" value={entry.contentScore} />
                      <ScorePill label="Delivery" value={entry.deliveryScore} />
                      <ScorePill
                        label="Confidence"
                        value={entry.confidenceScore}
                      />
                    </div>

                    <p className="mt-3 text-sm leading-7 text-black/68">
                      {entry.comment || "No comment provided."}
                    </p>
                  </section>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
