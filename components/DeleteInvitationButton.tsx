"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  deleteInvitation,
  type DeleteInvitationState,
} from "@/app/session/[id]/actions";

type DeleteInvitationButtonProps = {
  sessionId: string;
  invitationId: string;
};

const initialState: DeleteInvitationState = {
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
    >
      {pending ? "Deleting..." : "Delete invitation"}
    </button>
  );
}

export function DeleteInvitationButton({
  sessionId,
  invitationId,
}: DeleteInvitationButtonProps) {
  const deleteInvitationAction = deleteInvitation.bind(
    null,
    sessionId,
    invitationId,
  );
  const [state, formAction] = useActionState(
    deleteInvitationAction,
    initialState,
  );

  return (
    <div className="space-y-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("Delete this pending invitation?")) {
            event.preventDefault();
          }
        }}
      >
        <SubmitButton />
      </form>

      {state.errors?.form ? (
        <p className="text-sm text-rose-700">{state.errors.form}</p>
      ) : null}
    </div>
  );
}
