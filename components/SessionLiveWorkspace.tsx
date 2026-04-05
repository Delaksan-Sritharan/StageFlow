"use client";

import { useMemo, useState } from "react";

import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackList } from "@/components/FeedbackList";
import { Timer } from "@/components/Timer";
import type { Feedback, Speaker, SpeakerRole } from "@/types";

type SessionLiveWorkspaceProps = {
  sessionId: string;
  isCreator: boolean;
  viewerRole: SpeakerRole | null;
  speakers: Speaker[];
  feedbackBySpeaker: Record<string, Feedback[]>;
};

function getInitialFinishedSpeakerIds(
  speakers: Speaker[],
  feedbackBySpeaker: Record<string, Feedback[]>,
) {
  return speakers
    .filter((speaker) => (feedbackBySpeaker[speaker.id] ?? []).length > 0)
    .map((speaker) => speaker.id);
}

export function SessionLiveWorkspace({
  sessionId,
  isCreator,
  viewerRole,
  speakers,
  feedbackBySpeaker,
}: SessionLiveWorkspaceProps) {
  const initialFinishedSpeakerIds = useMemo(
    () => getInitialFinishedSpeakerIds(speakers, feedbackBySpeaker),
    [speakers, feedbackBySpeaker],
  );
  const [finishedSpeakerIds, setFinishedSpeakerIds] = useState<string[]>(
    initialFinishedSpeakerIds,
  );
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(
    () => {
      const firstUnfinishedSpeaker = speakers.find(
        (speaker) => !initialFinishedSpeakerIds.includes(speaker.id),
      );

      return firstUnfinishedSpeaker?.id ?? speakers[0]?.id ?? null;
    },
  );

  const currentSpeaker =
    speakers.find((speaker) => speaker.id === currentSpeakerId) ?? null;
  const nextSpeaker = currentSpeakerId
    ? (speakers.find(
        (speaker) =>
          speaker.id !== currentSpeakerId &&
          !finishedSpeakerIds.includes(speaker.id),
      ) ?? null)
    : (speakers.find((speaker) => !finishedSpeakerIds.includes(speaker.id)) ??
      null);
  const canControlTimer = isCreator || viewerRole === "Speaker";
  const finishedSpeakers = speakers.filter((speaker) =>
    finishedSpeakerIds.includes(speaker.id),
  );

  const handleFinishSpeaker = () => {
    if (!currentSpeaker) {
      return;
    }

    const updatedFinishedIds = Array.from(
      new Set([...finishedSpeakerIds, currentSpeaker.id]),
    );
    const followingSpeaker = speakers.find(
      (speaker) =>
        speaker.id !== currentSpeaker.id &&
        !updatedFinishedIds.includes(speaker.id),
    );

    setFinishedSpeakerIds(updatedFinishedIds);
    setCurrentSpeakerId(followingSpeaker?.id ?? null);
    setTimerResetKey((currentKey) => currentKey + 1);
  };

  return (
    <section className="space-y-6 rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
          Live session
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
          Timer and feedback flow
        </h2>
        <p className="text-sm leading-7 text-black/62">
          Start the timer for the current speaker, then mark the speaker as
          finished to unlock feedback forms for that speaker.
        </p>
      </div>

      {currentSpeaker ? (
        <div className="space-y-5 rounded-3xl border border-black/8 bg-white/82 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
                Current speaker
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-black">
                {currentSpeaker.name}
              </h3>
              <p className="mt-1 text-sm text-black/58">
                {currentSpeaker.role}
              </p>
            </div>

            {nextSpeaker ? (
              <div className="rounded-3xl border border-black/8 bg-black/2 px-4 py-3 text-sm text-black/62">
                Up next: {nextSpeaker.name}
              </div>
            ) : (
              <div className="rounded-3xl border border-black/8 bg-black/2 px-4 py-3 text-sm text-black/62">
                Final speaker in progress
              </div>
            )}
          </div>

          <Timer
            key={`${currentSpeaker.id}-${timerResetKey}`}
            minTime={currentSpeaker.minTime}
            maxTime={currentSpeaker.maxTime}
            canStart={canControlTimer}
            startDisabledMessage={
              canControlTimer
                ? undefined
                : "Only the creator or an accepted participant with the Speaker role can start the timer."
            }
            className="max-w-none"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFinishSpeaker}
              disabled={!canControlTimer}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Finish speaker
            </button>
          </div>
        </div>
      ) : speakers.length === 0 ? (
        <p className="rounded-3xl border border-black/8 bg-white/80 px-4 py-3 text-sm text-black/62">
          No speakers have been added to this session yet.
        </p>
      ) : (
        <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          All speakers have finished. Feedback remains available below.
        </p>
      )}

      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
            Feedback
          </p>
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-black">
            Finished speakers
          </h3>
        </div>

        {finishedSpeakers.length === 0 ? (
          <p className="rounded-3xl border border-black/8 bg-white/80 px-4 py-3 text-sm text-black/62">
            Finish a speaker to unlock that speaker&apos;s feedback form.
          </p>
        ) : (
          <div className="space-y-5">
            {finishedSpeakers.map((speaker) => (
              <article
                key={speaker.id}
                className="rounded-4xl border border-black/8 bg-white/88 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xl font-semibold tracking-[-0.03em] text-black">
                      {speaker.name}
                    </p>
                    <p className="mt-1 text-sm text-black/58">{speaker.role}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <FeedbackForm
                      sessionId={sessionId}
                      speakerId={speaker.id}
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold tracking-[-0.01em] text-black">
                      Submitted feedback
                    </p>
                    <FeedbackList
                      feedback={feedbackBySpeaker[speaker.id] ?? []}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
