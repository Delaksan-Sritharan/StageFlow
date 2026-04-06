import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { InviteAcceptanceForm } from "@/components/InviteAcceptanceForm";
import type { InvitationStatus, SpeakerRole } from "@/types";
import { createClient } from "@/utils/supabase/server";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    rejected?: string;
  }>;
};

type InvitationRecord = {
  participant_id: number;
  session_id: number;
  session_title: string;
  session_date: string;
  invited_email: string | null;
  assigned_role: SpeakerRole | null;
  accepted: boolean;
  status?: InvitationStatus | null;
  participant_user_id: string | null;
};

function getInvitationStatus(
  invitation: InvitationRecord | null,
): InvitationStatus {
  if (invitation?.status === "accepted" || invitation?.status === "rejected") {
    return invitation.status;
  }

  return invitation?.accepted ? "accepted" : "pending";
}

function getInvitationStatusLabel(status: InvitationStatus) {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

function isValidInviteToken(token: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    token,
  );
}

function isMissingInvitationRpc(
  error: { code?: string; message?: string } | null,
) {
  return Boolean(
    error?.code === "PGRST202" ||
    error?.message?.includes("get_session_invitation"),
  );
}

function buildAuthHref(pathname: string, token: string) {
  return `${pathname}?redirectTo=${encodeURIComponent(`/invite/${token}`)}`;
}

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const { token } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!isValidInviteToken(token)) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col gap-6 px-6 py-10 md:px-10 md:py-14">
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          This invitation link is invalid.
        </section>
      </main>
    );
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("get_session_invitation", {
    target_invite_token: token,
  });

  const invitation = (
    Array.isArray(data) ? data[0] : data
  ) as InvitationRecord | null;
  const invitationStatus = getInvitationStatus(invitation);
  const rejectedByCurrentUser = resolvedSearchParams?.rejected === "1";

  if (
    invitationStatus === "accepted" &&
    invitation?.participant_user_id === user?.id
  ) {
    redirect(`/session/${invitation.session_id}`);
  }

  const isEmailMismatch = Boolean(
    user?.email &&
    invitation?.invited_email &&
    invitation.invited_email.toLowerCase() !== user.email.toLowerCase() &&
    invitation.participant_user_id !== user.id,
  );

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col gap-6 px-6 py-10 md:px-10 md:py-14">
      <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
          StageFlow / Invitation
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-black md:text-5xl">
          Join this session
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-black/62">
          Use your invite to join the session, confirm your role, and continue
          into the session workspace.
        </p>
      </section>

      {isMissingInvitationRpc(error) ? (
        <section className="rounded-4xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-950 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Run supabase/enable-invite-join-links.sql to enable invite join links,
          or supabase/sessions.sql for the full setup, then reload this page.
        </section>
      ) : error ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Failed to load invitation: {error.message}
        </section>
      ) : !invitation ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          This invitation link is invalid or has expired.
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                Session details
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-black">
                {invitation.session_title}
              </h2>
              <p className="text-sm leading-7 text-black/62">
                {new Date(
                  `${invitation.session_date}T00:00:00`,
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="mt-6 space-y-4 rounded-3xl border border-black/8 bg-white/80 p-5">
              <div>
                <p className="text-sm font-semibold text-black">Invite email</p>
                <p className="mt-1 text-sm text-black/62">
                  {invitation.invited_email ?? "Shareable invite link"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-black">Role</p>
                <p className="mt-1 text-sm text-black/62">
                  {invitation.assigned_role ?? "Choose your role when joining"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-black">Status</p>
                <p className="mt-1 text-sm text-black/62">
                  {getInvitationStatusLabel(invitationStatus)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
            {!user ? (
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                    Authentication required
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                    Sign in or create an account to join
                  </h2>
                  <p className="text-sm leading-7 text-black/62">
                    After logging in, you will return to this invitation
                    automatically.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={buildAuthHref("/login", token)}
                    className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Log in
                  </Link>
                  <Link
                    href={buildAuthHref("/signup", token)}
                    className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            ) : invitationStatus === "accepted" &&
              invitation.participant_user_id &&
              invitation.participant_user_id !== user.id ? (
              <div className="space-y-3 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <h2 className="text-lg font-semibold text-black">
                  Invite already claimed
                </h2>
                <p>
                  This invitation has already been accepted by another
                  participant.
                </p>
              </div>
            ) : isEmailMismatch ? (
              <div className="space-y-3 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <h2 className="text-lg font-semibold text-black">
                  Email mismatch
                </h2>
                <p>
                  This invitation is reserved for {invitation.invited_email}.
                  Log in with that email address to accept it.
                </p>
              </div>
            ) : invitationStatus === "rejected" ? (
              <div className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <h2 className="text-lg font-semibold text-black">
                  Invitation closed
                </h2>
                <p>
                  {rejectedByCurrentUser ||
                  invitation.participant_user_id === user.id
                    ? "You have rejected this invitation"
                    : "This invitation has already been rejected."}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                    Respond to invitation
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                    Join as {invitation.assigned_role ?? "your selected role"}
                  </h2>
                  <p className="text-sm leading-7 text-black/62">
                    Accept this invitation to join the session, or reject it to
                    close the invite without deleting the record.
                  </p>
                </div>

                <InviteAcceptanceForm
                  token={token}
                  assignedRole={invitation.assigned_role}
                />
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
