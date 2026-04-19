"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitFeedback,
  type FeedbackFormState,
} from "@/app/session/[id]/actions";

const initialState: FeedbackFormState = {
  errors: {},
};

type FeedbackFormProps = {
  sessionId: string;
  speakerId: string;
  sessionParticipantId: string;
  disabledReason?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
    >
      {pending ? "Saving..." : "Submit feedback"}
    </button>
  );
}

function getScoreColor(n: number, selected: boolean) {
  if (!selected) {
    return "border-black/10 bg-white text-black/60 hover:border-black/25 hover:bg-black/3";
  }

  if (n <= 4) {
    return "border-rose-300 bg-rose-500 text-white shadow-[0_2px_8px_rgba(244,63,94,0.35)]";
  }

  if (n <= 7) {
    return "border-amber-300 bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]";
  }

  return "border-emerald-300 bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]";
}

function ScoreSelector({
  name,
  label,
  description,
  value,
  onChange,
  error,
  disabled,
}: {
  name: string;
  label: string;
  description: string;
  value: number | null;
  onChange: (v: number) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tracking-[-0.01em] text-black">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-black/48">{description}</p>
        </div>
        {value !== null ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
              value <= 4
                ? "bg-rose-100 text-rose-700"
                : value <= 7
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {value} / 10
          </span>
        ) : null}
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`flex h-9 flex-1 items-center justify-center rounded-xl border text-xs font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${getScoreColor(n, value === n)}`}
          >
            {n}
          </button>
        ))}
      </div>

      <input type="hidden" name={name} value={value ?? ""} />

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function FeedbackForm({
  sessionId,
  speakerId,
  sessionParticipantId,
  disabledReason,
}: FeedbackFormProps) {
  const submitFeedbackForSpeaker = submitFeedback.bind(
    null,
    sessionId,
    speakerId,
  );
  const [state, formAction] = useActionState(
    submitFeedbackForSpeaker,
    initialState,
  );

  const [contentScore, setContentScore] = useState<number | null>(null);
  const [deliveryScore, setDeliveryScore] = useState<number | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.success) {
      setContentScore(null);
      setDeliveryScore(null);
      setConfidenceScore(null);
      setShowToast(true);

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3500);
    }
  }, [state.success]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const isDisabled = Boolean(disabledReason);

  return (
    <div className="space-y-5">
      {/* Success toast */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          showToast
            ? "translate-y-0 opacity-100"
            : "translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 shadow-[0_8px_30px_rgba(16,185,129,0.18)]">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <p className="text-sm font-semibold text-emerald-800">
            Feedback submitted
          </p>
        </div>
      </div>

      {disabledReason ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {disabledReason}
        </div>
      ) : null}

      <form action={formAction} className="space-y-5">
        <input
          type="hidden"
          name="sessionParticipantId"
          value={sessionParticipantId}
        />

        <div
          className={`space-y-5 ${isDisabled ? "pointer-events-none opacity-45" : ""}`}
        >
          <ScoreSelector
            name="contentScore"
            label="Content"
            description="Structure, relevance, and clarity of ideas"
            value={contentScore}
            onChange={setContentScore}
            error={state.errors?.contentScore}
            disabled={isDisabled}
          />
          <ScoreSelector
            name="deliveryScore"
            label="Delivery"
            description="Pace, tone, and vocal control"
            value={deliveryScore}
            onChange={setDeliveryScore}
            error={state.errors?.deliveryScore}
            disabled={isDisabled}
          />
          <ScoreSelector
            name="confidenceScore"
            label="Confidence"
            description="Eye contact, body language, and presence"
            value={confidenceScore}
            onChange={setConfidenceScore}
            error={state.errors?.confidenceScore}
            disabled={isDisabled}
          />

          <div className="space-y-2">
            <label
              htmlFor={`comment-${speakerId}`}
              className="text-sm font-semibold tracking-[-0.01em] text-black"
            >
              Notes{" "}
              <span className="font-normal text-black/40">(optional)</span>
            </label>
            <textarea
              id={`comment-${speakerId}`}
              name="comment"
              rows={3}
              disabled={isDisabled}
              placeholder="Specific observations, tips, or encouragement…"
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition-colors duration-200 placeholder:text-black/30 focus:border-black/30 disabled:cursor-not-allowed"
            />
          </div>

          <SubmitButton />
        </div>

        {state.errors?.form ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.errors.form}
          </p>
        ) : null}
      </form>
    </div>
  );
}
