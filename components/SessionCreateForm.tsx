"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createSession,
  type SessionFormState,
} from "@/app/session/create/actions";

const initialState: SessionFormState = {
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:w-auto"
    >
      {pending ? "Saving..." : "Create session"}
    </button>
  );
}

export function SessionCreateForm() {
  const [state, formAction] = useActionState(createSession, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Session title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Club Meeting 42"
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
        />
        {state.errors?.title ? (
          <p className="text-sm text-rose-600">{state.errors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="date"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 focus:border-black/30"
        />
        {state.errors?.date ? (
          <p className="text-sm text-rose-600">{state.errors.date}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="evaluationMode"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Evaluation mode
        </label>
        <select
          id="evaluationMode"
          name="evaluationMode"
          defaultValue="open"
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 focus:border-black/30"
        >
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
        </select>
        <p className="text-xs leading-6 text-black/48">
          Open stores the default collaborative mode now. Assigned is available
          for future restriction rules.
        </p>
        {state.errors?.evaluationMode ? (
          <p className="text-sm text-rose-600">{state.errors.evaluationMode}</p>
        ) : null}
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
