"use client";

import { useEffect, useMemo, useState } from "react";

import {
  finishSpeakerTimerAction,
  pauseTimerAction,
  resetTimerAction,
  startTimerAction,
} from "@/app/session/[id]/timer-actions";
import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackList } from "@/components/FeedbackList";
import { Timer } from "@/components/Timer";
import type {
  EvaluationMode,
  Feedback,
  Speaker,
  SpeakerRole,
  SpeakerTimerState,
} from "@/types";
import { createClient } from "@/utils/supabase/client";

type SessionLiveWorkspaceProps = {
  sessionId: string;
  evaluationMode: EvaluationMode;
  isCreator: boolean;
  viewerParticipantId: string | null;
  viewerRole: SpeakerRole | null;
  viewerLabel: string;
  speakers: Speaker[];
  participantLabels: Record<string, string>;
  authorLabels: Record<string, string>;
  feedbackBySpeaker: Record<string, Feedback[]>;
  initialTimerStates: Record<string, SpeakerTimerState>;
};

type TimerStateRow = {
  speaker_id: string;
  session_id: string;
  is_running: boolean;
  is_finished: boolean;
  started_at: string | null;
  paused_elapsed_ms: number;
  started_by_user_id: string | null;
  started_by_name: string | null;
};

function rowToTimerState(row: TimerStateRow): SpeakerTimerState {
  return {
    speakerId: row.speaker_id,
    sessionId: row.session_id,
    isRunning: row.is_running,
    isFinished: row.is_finished,
    startedAt: row.started_at,
    pausedElapsedMs: row.paused_elapsed_ms,
    startedByUserId: row.started_by_user_id,
    startedByName: row.started_by_name,
  };
}

function defaultTimerState(
  speakerId: string,
  sessionId: string,
): SpeakerTimerState {
  return {
    speakerId,
    sessionId,
    isRunning: false,
    isFinished: false,
    startedAt: null,
    pausedElapsedMs: 0,
    startedByUserId: null,
    startedByName: null,
  };
}

export function SessionLiveWorkspace({
  sessionId,
  evaluationMode,
  isCreator,
  viewerParticipantId,
  viewerRole,
  viewerLabel,
  speakers,
  participantLabels,
  authorLabels,
  feedbackBySpeaker,
  initialTimerStates,
}: SessionLiveWorkspaceProps) {
  const [timerStates, setTimerStates] =
    useState<Record<string, SpeakerTimerState>>(initialTimerStates);

  // Real-time sync for timer states
  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;

    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`timer-states-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "speaker_timer_states",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as TimerStateRow;

          setTimerStates((prev) => ({
            ...prev,
            [row.speaker_id]: rowToTimerState(row),
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const finishedSpeakerIds = useMemo(() => {
    const fromFeedback = speakers
      .filter((s) => (feedbackBySpeaker[s.id] ?? []).length > 0)
      .map((s) => s.id);
    const fromTimer = Object.values(timerStates)
      .filter((s) => s.isFinished)
      .map((s) => s.speakerId);

    return Array.from(new Set([...fromFeedback, ...fromTimer]));
  }, [speakers, feedbackBySpeaker, timerStates]);

  const canControlTimer = isCreator || viewerRole === "Evaluator";
  const finishedSpeakers = speakers.filter((s) =>
    finishedSpeakerIds.includes(s.id),
  );
  const currentSpeaker =
    speakers.find((s) => !finishedSpeakerIds.includes(s.id)) ?? null;
  const nextSpeaker = currentSpeaker
    ? (speakers.find(
        (s) =>
          s.id !== currentSpeaker.id && !finishedSpeakerIds.includes(s.id),
      ) ?? null)
    : null;

  const getTimerState = (speakerId: string) =>
    timerStates[speakerId] ?? defaultTimerState(speakerId, sessionId);

  const getFeedbackRestrictionReason = (speaker: Speaker): string | null => {
    if (!speaker.sessionParticipantId) {
      return "This speaker is not linked to an accepted participant yet, so feedback submission is disabled until the session creator fixes that mapping.";
    }

    // Speaker cannot give feedback for themselves
    if (viewerParticipantId === speaker.sessionParticipantId) {
      return "You cannot give feedback for your own speech. Feedback must be submitted by the evaluator or other participants.";
    }

    if (evaluationMode === "open") {
      return null;
    }

    if (!speaker.assignedEvaluatorParticipantId) {
      return "Assigned evaluation mode is enabled, but no evaluator has been assigned to this speaker yet.";
    }

    if (viewerParticipantId !== speaker.assignedEvaluatorParticipantId) {
      const assignedLabel =
        participantLabels[speaker.assignedEvaluatorParticipantId] ??
        "the assigned evaluator";

      return `Only ${assignedLabel} can submit feedback for this speaker in assigned mode.`;
    }

    return null;
  };

  const handleFinishSpeaker = async () => {
    if (!currentSpeaker) return;

    // Optimistic update
    setTimerStates((prev) => ({
      ...prev,
      [currentSpeaker.id]: {
        ...(prev[currentSpeaker.id] ??
          defaultTimerState(currentSpeaker.id, sessionId)),
        isRunning: false,
        isFinished: true,
      },
    }));

    await finishSpeakerTimerAction(sessionId, currentSpeaker.id);
  };

  const handleTimerStart = (speakerId: string) => {
    const now = new Date().toISOString();
    const current = getTimerState(speakerId);

    setTimerStates((prev) => ({
      ...prev,
      [speakerId]: {
        ...current,
        isRunning: true,
        startedAt: now,
        startedByName: viewerLabel,
      },
    }));

    startTimerAction(sessionId, speakerId, viewerLabel);
  };

  const handleTimerPause = (speakerId: string, elapsedMs: number) => {
    setTimerStates((prev) => ({
      ...prev,
      [speakerId]: {
        ...(prev[speakerId] ?? defaultTimerState(speakerId, sessionId)),
        isRunning: false,
        pausedElapsedMs: elapsedMs,
        startedAt: null,
      },
    }));

    pauseTimerAction(sessionId, speakerId, elapsedMs);
  };

  const handleTimerReset = (speakerId: string) => {
    setTimerStates((prev) => ({
      ...prev,
      [speakerId]: {
        ...(prev[speakerId] ?? defaultTimerState(speakerId, sessionId)),
        isRunning: false,
        pausedElapsedMs: 0,
        startedAt: null,
        startedByName: null,
      },
    }));

    resetTimerAction(sessionId, speakerId);
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
          The session creator or evaluator starts the timer for the current
          speaker. Once the speaker is marked as finished, feedback forms
          unlock.
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

          {(() => {
            const ts = getTimerState(currentSpeaker.id);

            return (
              <Timer
                minTime={currentSpeaker.minTime}
                maxTime={currentSpeaker.maxTime}
                isRunning={ts.isRunning}
                startedAt={ts.startedAt}
                pausedElapsedMs={ts.pausedElapsedMs}
                startedByLabel={ts.isRunning ? ts.startedByName : null}
                canControl={canControlTimer}
                className="max-w-none"
                onStart={() => handleTimerStart(currentSpeaker.id)}
                onPause={(ms) => handleTimerPause(currentSpeaker.id, ms)}
                onReset={() => handleTimerReset(currentSpeaker.id)}
              />
            );
          })()}

          {canControlTimer ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFinishSpeaker}
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
              >
                Finish speaker
              </button>
            </div>
          ) : null}
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
                    {speaker.sessionParticipantId ? (
                      <FeedbackForm
                        sessionId={sessionId}
                        speakerId={speaker.id}
                        sessionParticipantId={speaker.sessionParticipantId}
                        disabledReason={
                          getFeedbackRestrictionReason(speaker) ?? undefined
                        }
                      />
                    ) : (
                      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-950">
                        This speaker is not linked to an accepted participant
                        yet, so feedback submission is disabled until the
                        session creator fixes that mapping.
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold tracking-[-0.01em] text-black">
                      Submitted feedback
                    </p>
                    {speaker.sessionParticipantId ? (
                      <div className="space-y-1 text-sm text-black/58">
                        <p>
                          Evaluating{" "}
                          {participantLabels[speaker.sessionParticipantId] ??
                            "linked participant"}
                        </p>
                        {evaluationMode === "assigned" ? (
                          <p>
                            Assigned evaluator:{" "}
                            {speaker.assignedEvaluatorParticipantId
                              ? (participantLabels[
                                  speaker.assignedEvaluatorParticipantId
                                ] ?? "Assigned evaluator")
                              : "Not assigned yet"}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-rose-600">
                        Link this speaker to an accepted participant before
                        feedback can be attributed correctly.
                      </p>
                    )}
                    <FeedbackList
                      feedback={feedbackBySpeaker[speaker.id] ?? []}
                      authorLabels={authorLabels}
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
