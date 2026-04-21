import { headers } from "next/headers";

import { DeleteInvitationButton } from "@/components/DeleteInvitationButton";
import type { SessionParticipant } from "@/types";

type SessionInvitationsListProps = {
  sessionId: string;
  invitations: SessionParticipant[];
};

function getStatusLabel(status: SessionParticipant["status"]) {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

function getStatusClassName(status: SessionParticipant["status"]) {
  switch (status) {
    case "accepted":
      return "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800";
    case "rejected":
      return "rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700";
    default:
      return "rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800";
  }
}

export async function SessionInvitationsList({
  sessionId,
  invitations,
}: SessionInvitationsListProps) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  if (invitations.length === 0) {
    return (
      <p className="rounded-3xl border border-black/8 bg-white/80 px-4 py-3 text-sm text-black/62">
        No invitations yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <article
          key={invitation.id}
          className="rounded-3xl border border-black/8 bg-white/84 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-black">
                {invitation.invitedEmail || "Shareable invite link"}
              </p>
              <p className="mt-1 text-sm text-black/58">
                {invitation.role || "Role not set"}
              </p>
            </div>

            <div className={getStatusClassName(invitation.status)}>
              {getStatusLabel(invitation.status)}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-black/58">
              {invitation.status === "pending"
                ? "Waiting for the invited participant to respond."
                : invitation.status === "accepted"
                  ? "This participant already accepted the invitation."
                  : "This invitation was rejected and kept for recordkeeping."}
            </p>

            {invitation.status === "pending" ? (
              <DeleteInvitationButton
                sessionId={sessionId}
                invitationId={invitation.id}
              />
            ) : null}
          </div>

          {invitation.inviteToken ? (
            <p className="mt-3 break-all text-sm leading-7 text-black/66">
              {baseUrl}/invite/{invitation.inviteToken}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
