"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  acceptInvitation,
  type AcceptInvitationState,
} from "@/app/invite/[token]/actions";
import type { SpeakerRole } from "@/types";

const roles: SpeakerRole[] = ["Speaker", "Evaluator", "Table Topics"];

const initialState: AcceptInvitationState = {
  errors: {},
};

type InviteAcceptanceFormProps = {
  token: string;
  assignedRole: SpeakerRole | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
    >
      {pending ? "Joining..." : "Accept invitation"}
    </button>
  );
}

export function InviteAcceptanceForm({
  token,
  assignedRole,
}: InviteAcceptanceFormProps) {
  const invitationAction = acceptInvitation.bind(null, token);
  const [state, formAction] = useActionState(invitationAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {assignedRole ? (
        <div className="rounded-3xl border border-black/8 bg-white/82 p-4">
          <p className="text-sm font-semibold text-black">Assigned role</p>
          <p className="mt-2 text-sm leading-7 text-black/62">{assignedRole}</p>
          <input type="hidden" name="role" value={assignedRole} />
        </div>
      ) : (
        <div className="space-y-2">
          <label
            htmlFor="role"
            className="text-sm font-semibold tracking-[-0.01em] text-black"
          >
            Choose your role
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
      )}

      {state.errors?.form ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.errors.form}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
