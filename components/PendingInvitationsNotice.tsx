import Link from "next/link";

import type { SpeakerRole } from "@/types";

type PendingInvitation = {
  participantId: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  assignedRole: SpeakerRole | null;
  inviteToken: string;
  invitedEmail: string | null;
};

type PendingInvitationsNoticeProps = {
  invitations: PendingInvitation[];
};

export function PendingInvitationsNotice({
  invitations,
}: PendingInvitationsNoticeProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="rounded-4xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.05)] md:p-8">
      <div className="flex flex-col gap-3 border-b border-emerald-200/80 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-900/55">
            Notifications
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-black">
            Pending invitations
          </h2>
        </div>
        <p className="text-sm text-black/60">
          {invitations.length} invitation{invitations.length === 1 ? "" : "s"}{" "}
          waiting for your response
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {invitations.map((invitation) => (
          <article
            key={invitation.participantId}
            className="rounded-3xl border border-emerald-200/80 bg-white/88 p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-black">
                  {invitation.sessionTitle}
                </p>
                <p className="mt-1 text-sm text-black/60">
                  {new Date(
                    `${invitation.sessionDate}T00:00:00`,
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                {invitation.assignedRole ?? "Role to choose"}
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-black/66">
              {invitation.invitedEmail
                ? `Reserved for ${invitation.invitedEmail}.`
                : "Shared invitation link available for your account."}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-black/54">
                Open the invite to confirm your role and join the session.
              </p>
              <Link
                href={`/invite/${invitation.inviteToken}`}
                className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto"
              >
                Review invite
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
