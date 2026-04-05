import type { Feedback } from "@/types";

type FeedbackListProps = {
  feedback: Feedback[];
};

export function FeedbackList({ feedback }: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <p className="rounded-3xl border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/62">
        No feedback submitted yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((entry) => (
        <article
          key={entry.id}
          className="rounded-3xl border border-black/8 bg-white/82 p-4"
        >
          <div className="flex flex-wrap gap-2 text-sm text-black/65">
            <div className="rounded-full border border-black/8 bg-black/2 px-3 py-1.5">
              Content {entry.contentScore}/10
            </div>
            <div className="rounded-full border border-black/8 bg-black/2 px-3 py-1.5">
              Delivery {entry.deliveryScore}/10
            </div>
            <div className="rounded-full border border-black/8 bg-black/2 px-3 py-1.5">
              Confidence {entry.confidenceScore}/10
            </div>
          </div>

          {entry.comment ? (
            <p className="mt-3 text-sm leading-7 text-black/68">
              {entry.comment}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
