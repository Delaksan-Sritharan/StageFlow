"use client";

import { useFormStatus } from "react-dom";

import { deleteSession } from "@/app/dashboard/actions";

type DeleteSessionButtonProps = {
  sessionId: string;
  className?: string;
};

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Deleting..." : "Delete session"}
    </button>
  );
}

export function DeleteSessionButton({
  sessionId,
  className,
}: DeleteSessionButtonProps) {
  return (
    <form
      action={deleteSession}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this session and all related speakers, invitations, and feedback?",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <SubmitButton
        className={
          className ??
          "inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
        }
      />
    </form>
  );
}
