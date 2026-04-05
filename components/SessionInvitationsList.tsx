import type { SessionParticipant } from "@/types";

type SessionInvitationsListProps = {
  invitations: SessionParticipant[];
};

export function SessionInvitationsList({
  invitations,
}: SessionInvitationsListProps) {
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

            <div className="rounded-full border border-black/8 bg-black/2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-black/58">
              {invitation.accepted ? "Accepted" : "Pending"}
            </div>
          </div>

          {invitation.inviteToken ? (
            <p className="mt-3 break-all text-sm leading-7 text-black/66">
              /invite/{invitation.inviteToken}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
