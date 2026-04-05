"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { addSpeaker, type SpeakerFormState } from "@/app/session/[id]/actions";
import type { SpeakerRole } from "@/types";

const initialState: SpeakerFormState = {
  errors: {},
};

const speakerRoles: SpeakerRole[] = ["Speaker", "Evaluator", "Table Topics"];

type SpeakerFormProps = {
  sessionId: string;
  participants: Array<{
    id: string;
    label: string;
    role: SpeakerRole | null;
  }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:w-auto"
    >
      {pending ? "Adding..." : "Add speaker"}
    </button>
  );
}

export function SpeakerForm({ sessionId, participants }: SpeakerFormProps) {
  const addSpeakerForSession = addSpeaker.bind(null, sessionId);
  const [state, formAction] = useActionState(
    addSpeakerForSession,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="sessionParticipantId"
            className="text-sm font-semibold tracking-[-0.01em] text-black"
          >
            Evaluated participant
          </label>
          <select
            id="sessionParticipantId"
            name="sessionParticipantId"
            required
            defaultValue=""
            className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 focus:border-black/30"
          >
            <option value="" disabled>
              Select accepted participant
            </option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.label}
                {participant.role ? ` • ${participant.role}` : ""}
              </option>
            ))}
          </select>
          {state.errors?.sessionParticipantId ? (
            <p className="text-sm text-rose-600">
              {state.errors.sessionParticipantId}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="name"
            className="text-sm font-semibold tracking-[-0.01em] text-black"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Aisha Carter"
            className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
          />
          {state.errors?.name ? (
            <p className="text-sm text-rose-600">{state.errors.name}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="role"
            className="text-sm font-semibold tracking-[-0.01em] text-black"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue="Speaker"
            className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 focus:border-black/30"
          >
            {speakerRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {state.errors?.role ? (
            <p className="text-sm text-rose-600">{state.errors.role}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="minTime"
            className="text-sm font-semibold tracking-[-0.01em] text-black"
          >
            Min time (seconds)
          </label>
          <input
            id="minTime"
            name="minTime"
            type="number"
            min="0"
            step="1"
            required
            placeholder="300"
            className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
          />
          {state.errors?.minTime ? (
            <p className="text-sm text-rose-600">{state.errors.minTime}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="maxTime"
            className="text-sm font-semibold tracking-[-0.01em] text-black"
          >
            Max time (seconds)
          </label>
          <input
            id="maxTime"
            name="maxTime"
            type="number"
            min="0"
            step="1"
            required
            placeholder="420"
            className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
          />
          {state.errors?.maxTime ? (
            <p className="text-sm text-rose-600">{state.errors.maxTime}</p>
          ) : null}
        </div>
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
