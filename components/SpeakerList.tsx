import type { Speaker } from "@/types";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

type SpeakerListProps = {
  speakers: Speaker[];
};

export function SpeakerList({ speakers }: SpeakerListProps) {
  if (speakers.length === 0) {
    return (
      <p className="rounded-4xl border border-black/8 bg-white/80 px-5 py-4 text-sm text-black/65 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        No speakers added yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {speakers.map((speaker) => (
        <article
          key={speaker.id}
          className="rounded-4xl border border-black/8 bg-white/84 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-black">
                {speaker.name}
              </p>
              <p className="mt-1 text-sm text-black/58">{speaker.role}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-black/65">
              <div className="rounded-full border border-black/8 bg-black/2 px-4 py-2">
                Min {formatTime(speaker.minTime)}
              </div>
              <div className="rounded-full border border-black/8 bg-black/2 px-4 py-2">
                Max {formatTime(speaker.maxTime)}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
