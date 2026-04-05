"use client";

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
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
    >
      {pending ? "Saving..." : "Submit feedback"}
    </button>
  );
}

function ScoreField({
  id,
  name,
  label,
  error,
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-semibold tracking-[-0.01em] text-black"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        min="1"
        max="10"
        step="1"
        required
        placeholder="8"
        className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

export function FeedbackForm({ sessionId, speakerId }: FeedbackFormProps) {
  const submitFeedbackForSpeaker = submitFeedback.bind(
    null,
    sessionId,
    speakerId,
  );
  const [state, formAction] = useActionState(
    submitFeedbackForSpeaker,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <ScoreField
          id={`contentScore-${speakerId}`}
          name="contentScore"
          label="Content score"
          error={state.errors?.contentScore}
        />
        <ScoreField
          id={`deliveryScore-${speakerId}`}
          name="deliveryScore"
          label="Delivery score"
          error={state.errors?.deliveryScore}
        />
        <ScoreField
          id={`confidenceScore-${speakerId}`}
          name="confidenceScore"
          label="Confidence score"
          error={state.errors?.confidenceScore}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`comment-${speakerId}`}
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Comment
        </label>
        <textarea
          id={`comment-${speakerId}`}
          name="comment"
          rows={4}
          placeholder="Optional notes about the speech or evaluation."
          className="w-full resize-y rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
        />
      </div>

      {state.errors?.form ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.errors.form}
        </p>
      ) : null}

      <div className="flex items-center justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
