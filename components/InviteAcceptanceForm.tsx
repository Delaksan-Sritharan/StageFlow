"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  acceptInvitation,
  type AcceptInvitationState,
  rejectInvitation,
  type RejectInvitationState,
} from "@/app/invite/[token]/actions";
import type { SpeakerRole } from "@/types";

const roles: SpeakerRole[] = ["Speaker", "Evaluator"];

const initialState: AcceptInvitationState = {
  errors: {},
};

const initialRejectState: RejectInvitationState = {
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
      className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:w-auto"
    >
      {pending ? "Joining..." : "Accept invitation"}
    </button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
    >
      {pending ? "Rejecting..." : "Reject invitation"}
    </button>
  );
}

export function InviteAcceptanceForm({
  token,
  assignedRole,
}: InviteAcceptanceFormProps) {
  const acceptInvitationAction = acceptInvitation.bind(null, token);
  const rejectInvitationAction = rejectInvitation.bind(null, token);
  const [acceptState, acceptFormAction] = useActionState(
    acceptInvitationAction,
    initialState,
  );
  const [rejectState, rejectFormAction] = useActionState(
    rejectInvitationAction,
    initialRejectState,
  );

  return (
    <div className="space-y-4">
      <form action={acceptFormAction} className="space-y-5">
        {assignedRole ? (
          <div className="rounded-3xl border border-black/8 bg-white/82 p-4">
            <p className="text-sm font-semibold text-black">Assigned role</p>
            <p className="mt-2 text-sm leading-7 text-black/62">
              {assignedRole}
            </p>
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
            {acceptState.errors?.role ? (
              <p className="text-sm text-rose-600">{acceptState.errors.role}</p>
            ) : null}
          </div>
        )}

        {acceptState.errors?.form ? (
          <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {acceptState.errors.form}
          </p>
        ) : null}

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>

      {rejectState.errors?.form ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {rejectState.errors.form}
        </p>
      ) : null}

      <form action={rejectFormAction} className="flex justify-end">
        <RejectButton />
      </form>
    </div>
  );
}
