import Link from "next/link";
import { cookies } from "next/headers";

import { DashboardSessionCard } from "@/components/DashboardSessionCard";
import { PendingInvitationsNotice } from "@/components/PendingInvitationsNotice";
import { Timer } from "@/components/Timer";
import { createClient } from "@/utils/supabase/server";

type PendingInvitationRow = {
  participant_id: number;
  session_id: number;
  session_title: string;
  session_date: string;
  assigned_role: "Speaker" | "Evaluator" | "Table Topics" | null;
  invite_token: string;
  invited_email: string | null;
};

function getSessionOwnerId(session: {
  creator_id?: string | null;
  user_id?: string | null;
}) {
  return session.creator_id ?? session.user_id ?? null;
}

function isMissingSessionsTable(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes("Could not find the table 'public.sessions'")
  );
}

function isMissingParticipantsTable(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes(
      "Could not find the table 'public.session_participants'",
    )
  );
}

function isBrokenParticipantsPolicy(error: { message?: string } | null) {
  return Boolean(
    error?.message?.includes(
      'infinite recursion detected in policy for relation "session_participants"',
    ),
  );
}

function isMissingPendingInvitesRpc(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST202" ||
    error.message?.includes("get_my_pending_invitations")
  );
}

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: true });

  const sessionIds = sessions?.map((session) => session.id) ?? [];
  const { data: participantRows, error: participantsError } = sessionIds.length
    ? await supabase
        .from("session_participants")
        .select("*")
        .in("session_id", sessionIds)
    : { data: [], error: null };
  const { data: pendingInvitationsData, error: pendingInvitationsError } = user
    ? await supabase.rpc("get_my_pending_invitations")
    : { data: [], error: null };

  const showSetupState =
    isMissingSessionsTable(error) || isBrokenParticipantsPolicy(error);
  const showParticipantsSetupState =
    isMissingParticipantsTable(participantsError) ||
    isBrokenParticipantsPolicy(participantsError);

  const participantCountBySession = new Map<string, number>();
  const pendingInvitations =
    (pendingInvitationsData as PendingInvitationRow[] | null)?.map(
      (invitation) => ({
        participantId: String(invitation.participant_id),
        sessionId: String(invitation.session_id),
        sessionTitle: invitation.session_title,
        sessionDate: invitation.session_date,
        assignedRole: invitation.assigned_role,
        inviteToken: String(invitation.invite_token),
        invitedEmail: invitation.invited_email ?? null,
      }),
    ) ?? [];

  participantRows?.forEach((row) => {
    if (row.accepted === false) {
      return;
    }

    const sessionId = String(row.session_id);
    participantCountBySession.set(
      sessionId,
      (participantCountBySession.get(sessionId) ?? 0) + 1,
    );
  });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <section className="overflow-hidden rounded-4xl border border-black/8 bg-white/82 px-6 py-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:px-10 md:py-12">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/45">
                StageFlow / Dashboard
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.07em] text-black md:text-6xl">
                Welcome back
                {user?.user_metadata?.display_name
                  ? `, ${user.user_metadata.display_name}`
                  : ""}
                .
              </h1>
              <p className="max-w-2xl text-base leading-8 text-black/65 md:text-lg">
                Review sessions you created or joined, manage speakers, collect
                feedback, and keep live timing visible without losing the room.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/session/create"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Create new session
              </Link>
              <Link
                href="/timer"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
              >
                Open timer mode
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border border-black/8 bg-white/84 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.05)]">
            <Timer minTime={60} maxTime={90} className="max-w-none" />
          </div>
        </div>
      </section>

      {!isMissingPendingInvitesRpc(pendingInvitationsError) ? (
        <PendingInvitationsNotice invitations={pendingInvitations} />
      ) : null}

      <section className="rounded-4xl border border-black/8 bg-white/84 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
              Sessions
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-black">
              Your session workspace
            </h2>
          </div>
          <p className="text-sm text-black/55">
            {sessions?.length ?? 0} saved{" "}
            {sessions?.length === 1 ? "session" : "sessions"}
          </p>
        </div>

        {showSetupState || showParticipantsSetupState ? (
          <section className="mt-6 space-y-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-950">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-black">
                The dashboard tables are not set up yet.
              </h3>
              <p className="leading-7 text-black/70">
                Run supabase/fix-session-participant-policies.sql if your tables
                already exist, or supabase/sessions.sql for a full setup, then
                refresh this page.
              </p>
            </div>
          </section>
        ) : error ? (
          <p className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Failed to load sessions: {error.message}
          </p>
        ) : participantsError ? (
          <p className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Failed to load participants: {participantsError.message}
          </p>
        ) : sessions && sessions.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <DashboardSessionCard
                key={session.id}
                session={{
                  id: String(session.id),
                  title: session.title,
                  date: session.date,
                  creatorId: getSessionOwnerId(session),
                }}
                participantCount={
                  participantCountBySession.get(String(session.id)) ?? 1
                }
                isCreator={getSessionOwnerId(session) === user?.id}
              />
            ))}
          </div>
        ) : (
          <section className="mt-6 rounded-4xl border border-dashed border-black/12 bg-white/75 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-black">
              No sessions yet.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/62">
              Create your first session to start inviting participants, adding
              speakers, collecting feedback, and generating a summary for live
              use.
            </p>
            <div className="mt-5 flex justify-center">
              <Link
                href="/session/create"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Create first session
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
