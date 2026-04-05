"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createInvitation,
  type InviteParticipantFormState,
} from "@/app/session/[id]/actions";
import type { SpeakerRole } from "@/types";

const initialState: InviteParticipantFormState = {
  errors: {},
};

const roles: SpeakerRole[] = ["Speaker", "Evaluator", "Table Topics"];

type InviteParticipantFormProps = {
  sessionId: string;
};

function SubmitButton({
  mode,
  label,
}: {
  mode: "email" | "link";
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="inviteMode"
      value={mode}
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function InviteParticipantForm({
  sessionId,
}: InviteParticipantFormProps) {
  const inviteForSession = createInvitation.bind(null, sessionId);
  const [state, formAction] = useActionState(inviteForSession, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="invitedEmail"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Participant email
        </label>
        <input
          id="invitedEmail"
          name="invitedEmail"
          type="email"
          placeholder="participant@example.com"
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
        />
        <p className="text-xs leading-6 text-black/48">
          Use email invites for a named participant, or leave this empty and
          generate a shareable invite link.
        </p>
        {state.errors?.invitedEmail ? (
          <p className="text-sm text-rose-600">{state.errors.invitedEmail}</p>
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
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {state.errors?.role ? (
          <p className="text-sm text-rose-600">{state.errors.role}</p>
        ) : null}
      </div>

      {state.errors?.form ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.errors.form}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}

      {state.inviteLink ? (
        <div className="rounded-3xl border border-black/8 bg-white/80 p-4">
          <p className="text-sm font-semibold text-black">Invite link</p>
          <p className="mt-2 break-all text-sm leading-7 text-black/68">
            {state.inviteLink}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <SubmitButton mode="email" label="Save email invite" />
        <SubmitButton mode="link" label="Generate invite link" />
      </div>
    </form>
  );
}
