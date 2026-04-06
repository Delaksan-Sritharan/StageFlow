import { cookies } from "next/headers";

import { DashboardHome } from "@/components/DashboardHome";
import { LandingPage } from "@/components/LandingPage";
import { createClient } from "@/utils/supabase/server";

type PendingInvitationRow = {
  participant_id: number;
  session_id: number;
  session_title: string;
  session_date: string;
  assigned_role: "Speaker" | "Evaluator" | null;
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

  if (!user) {
    return <LandingPage />;
  }

  return (
    <DashboardHome
      userDisplayName={user.user_metadata?.display_name ?? null}
      sessions={(sessions ?? []).map((session) => ({
        id: String(session.id),
        title: session.title,
        date: session.date,
        creatorId: getSessionOwnerId(session),
      }))}
      participantCountBySession={participantCountBySession}
      pendingInvitations={pendingInvitations}
      currentUserId={user.id}
      showSetupState={showSetupState}
      showParticipantsSetupState={showParticipantsSetupState}
      errorMessage={error?.message ?? null}
      participantsErrorMessage={participantsError?.message ?? null}
      showPendingInviteNotice={
        !isMissingPendingInvitesRpc(pendingInvitationsError)
      }
    />
  );
}
