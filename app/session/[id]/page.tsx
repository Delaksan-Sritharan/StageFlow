import Link from "next/link";
import { cookies } from "next/headers";

import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { InviteParticipantForm } from "@/components/InviteParticipantForm";
import { SessionLiveWorkspace } from "@/components/SessionLiveWorkspace";
import { SpeakerForm } from "@/components/SpeakerForm";
import { SessionParticipantsList } from "@/components/SessionParticipantsList";
import { SpeakerList } from "@/components/SpeakerList";
import { SessionInvitationsList } from "@/components/SessionInvitationsList";
import type { Feedback, SessionParticipant, Speaker } from "@/types";
import { createClient } from "@/utils/supabase/server";

function getParticipantLabel(
  participant: SessionParticipant,
  creatorId: string | null,
) {
  if (participant.userId && participant.userId === creatorId) {
    return "Session creator";
  }

  return participant.invitedEmail ?? participant.role ?? "Participant";
}

type SessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getSessionOwnerId(
  session: {
    creator_id?: string | null;
    user_id?: string | null;
  } | null,
) {
  if (!session) {
    return null;
  }

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

function isMissingSpeakersTable(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes("Could not find the table 'public.speakers'")
  );
}

function isMissingFeedbackTable(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes("Could not find the table 'public.feedback'")
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

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  const { data: participantsData, error: participantsError } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });
  const { data: speakersData, error: speakersError } = await supabase
    .from("speakers")
    .select(
      "id, session_id, session_participant_id, name, role, min_time, max_time",
    )
    .eq("session_id", id)
    .order("created_at", { ascending: true });
  const speakerIds = speakersData?.map((speaker) => speaker.id) ?? [];
  const { data: feedbackData, error: feedbackError } = speakerIds.length
    ? await supabase
        .from("feedback")
        .select(
          "id, speaker_id, session_participant_id, user_id, content_score, delivery_score, confidence_score, comment, created_at",
        )
        .in("speaker_id", speakerIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const showSetupState =
    isMissingSessionsTable(error) || isBrokenParticipantsPolicy(error);
  const showParticipantsSetupState =
    isMissingParticipantsTable(participantsError) ||
    isBrokenParticipantsPolicy(participantsError);
  const showSpeakersSetupState = isMissingSpeakersTable(speakersError);
  const showFeedbackSetupState = isMissingFeedbackTable(feedbackError);
  const sessionOwnerId = getSessionOwnerId(session);
  const isCreator = sessionOwnerId === user?.id;
  const participants: SessionParticipant[] =
    participantsData
      ?.map((participant) => ({
        id: String(participant.id),
        sessionId: String(participant.session_id),
        userId: participant.user_id ? String(participant.user_id) : null,
        invitedEmail: participant.invited_email ?? null,
        role: participant.role ?? null,
        accepted: participant.accepted ?? true,
        inviteToken: participant.invite_token ?? null,
      }))
      .filter(
        (participant) =>
          !(
            participant.userId === sessionOwnerId &&
            participant.accepted &&
            !participant.role
          ),
      ) ?? [];
  const acceptedParticipantsBase = participants.filter(
    (participant) =>
      participant.accepted || participant.userId === sessionOwnerId,
  );
  const acceptedParticipants =
    sessionOwnerId &&
    !acceptedParticipantsBase.some(
      (participant) => participant.userId === sessionOwnerId,
    )
      ? [
          {
            id: `creator-${sessionOwnerId}`,
            sessionId: id,
            userId: sessionOwnerId,
            invitedEmail: null,
            role: null,
            accepted: true,
            inviteToken: null,
          },
          ...acceptedParticipantsBase,
        ]
      : acceptedParticipantsBase;
  const acceptedParticipantsForSpeakerSelection = participants.filter(
    (participant) => participant.accepted,
  );
  const participantLabels = Object.fromEntries(
    acceptedParticipants.map((participant) => [
      participant.id,
      getParticipantLabel(participant, sessionOwnerId),
    ]),
  );
  const authorLabels = Object.fromEntries(
    acceptedParticipants
      .filter((participant) => participant.userId)
      .map((participant) => [
        participant.userId as string,
        getParticipantLabel(participant, sessionOwnerId),
      ]),
  );
  const viewerParticipant = acceptedParticipants.find(
    (participant) => participant.userId === user?.id,
  );
  const hasRoleBasedAccess = Boolean(isCreator || viewerParticipant);
  const viewerRole = isCreator ? null : (viewerParticipant?.role ?? null);
  const speakers: Speaker[] =
    speakersData?.map((speaker) => ({
      id: String(speaker.id),
      sessionId: String(speaker.session_id),
      sessionParticipantId: speaker.session_participant_id
        ? String(speaker.session_participant_id)
        : null,
      name: speaker.name,
      role: speaker.role,
      minTime: speaker.min_time,
      maxTime: speaker.max_time,
    })) ?? [];
  const feedbackBySpeaker = new Map<string, Feedback[]>();

  feedbackData?.forEach((entry) => {
    const speakerId = String(entry.speaker_id);
    const speakerFeedback = feedbackBySpeaker.get(speakerId) ?? [];

    speakerFeedback.push({
      id: String(entry.id),
      speakerId,
      sessionParticipantId: entry.session_participant_id
        ? String(entry.session_participant_id)
        : null,
      userId: entry.user_id ? String(entry.user_id) : null,
      contentScore: entry.content_score,
      deliveryScore: entry.delivery_score,
      confidenceScore: entry.confidence_score,
      comment: entry.comment,
      createdAt: entry.created_at,
    });

    feedbackBySpeaker.set(speakerId, speakerFeedback);
  });
  const serializedFeedbackBySpeaker = Object.fromEntries(
    Array.from(feedbackBySpeaker.entries()),
  );
  const liveWorkspaceKey = [
    speakers.map((speaker) => speaker.id).join(","),
    Object.keys(serializedFeedbackBySpeaker).sort().join(","),
    acceptedParticipants.map((participant) => participant.id).join(","),
  ].join("|");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12 md:px-10">
      <section className="rounded-4xl border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
              StageFlow / Session detail
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black">
              {session?.title ?? `Session ${id}`}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href="/session/create"
              className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3 sm:w-auto"
            >
              Create another session
            </Link>
            {isCreator ? (
              <>
                <Link
                  href={`/session/${id}/summary`}
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3 sm:w-auto"
                >
                  Open summary
                </Link>
                <DeleteSessionButton
                  sessionId={id}
                  className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

      {showSetupState ? (
        <section className="rounded-4xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-950 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          <h2 className="text-lg font-semibold text-black">
            The sessions table is not set up yet.
          </h2>
          <p className="mt-3 leading-7 text-black/70">
            Run supabase/fix-session-participant-policies.sql if your tables
            already exist, or supabase/sessions.sql for a full setup, then
            reload this page.
          </p>
        </section>
      ) : error ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Failed to load session: {error.message}
        </section>
      ) : session ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-4xl border border-black/8 bg-white/84 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                Session title
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-black">
                {session.title}
              </p>
            </article>
            <article className="rounded-4xl border border-black/8 bg-white/84 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                Date
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-black">
                {new Date(`${session.date}T00:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </p>
            </article>
          </section>

          {!hasRoleBasedAccess ? (
            <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
              You do not have access to this session. Only the creator and
              accepted invitees can open this page.
            </section>
          ) : (
            <>
              <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
                  <div className="mb-6 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                      Participants
                    </p>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                      Accepted participants
                    </h2>
                  </div>

                  {showParticipantsSetupState ? (
                    <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      The session participants table is not set up yet. Run the
                      SQL in supabase/sessions.sql and reload this page.
                    </p>
                  ) : participantsError ? (
                    <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Failed to load participants: {participantsError.message}
                    </p>
                  ) : (
                    <SessionParticipantsList
                      participants={acceptedParticipants}
                      creatorId={sessionOwnerId}
                    />
                  )}
                </section>

                {showFeedbackSetupState ? (
                  <section className="rounded-4xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-950 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
                    The feedback table is not set up yet. Run the SQL in
                    supabase/sessions.sql and reload this page.
                  </section>
                ) : feedbackError ? (
                  <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
                    Failed to load feedback: {feedbackError.message}
                  </section>
                ) : (
                  <SessionLiveWorkspace
                    key={liveWorkspaceKey}
                    sessionId={id}
                    isCreator={isCreator}
                    viewerRole={viewerRole}
                    speakers={speakers}
                    participantLabels={participantLabels}
                    authorLabels={authorLabels}
                    feedbackBySpeaker={serializedFeedbackBySpeaker}
                  />
                )}
              </section>

              {isCreator ? (
                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                        Invitations
                      </p>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                        Invite participants
                      </h2>
                      <p className="text-sm leading-7 text-black/62">
                        Invite by email or generate a shareable invite link,
                        then assign the participant role before they join.
                      </p>
                    </div>

                    <div className="mt-6">
                      {showParticipantsSetupState ? (
                        <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                          The session participants table is not set up yet. Run
                          the SQL in supabase/sessions.sql and reload this page.
                        </p>
                      ) : participantsError ? (
                        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          Failed to load invitations:{" "}
                          {participantsError.message}
                        </p>
                      ) : (
                        <InviteParticipantForm sessionId={id} />
                      )}
                    </div>
                  </section>

                  <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
                    <div className="mb-6 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                        Invitations
                      </p>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                        Pending and accepted invites
                      </h2>
                    </div>

                    {showParticipantsSetupState ? (
                      <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        Run the SQL in supabase/sessions.sql to enable
                        invitation storage.
                      </p>
                    ) : participantsError ? (
                      <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        Failed to load invitations: {participantsError.message}
                      </p>
                    ) : (
                      <SessionInvitationsList invitations={participants} />
                    )}
                  </section>
                </section>
              ) : null}

              <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                      Speaker management
                    </p>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                      Add speakers
                    </h2>
                    <p className="text-sm leading-7 text-black/62">
                      Add as many speakers as you need for this session with
                      role and timing windows.
                    </p>
                  </div>

                  <div className="mt-6">
                    {!isCreator ? (
                      <p className="rounded-3xl border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/62">
                        Only the session creator can manage speakers.
                      </p>
                    ) : showSpeakersSetupState ? (
                      <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        The speakers table is not set up yet. Run the SQL in
                        supabase/sessions.sql and reload this page.
                      </p>
                    ) : speakersError ? (
                      <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        Failed to load speakers: {speakersError.message}
                      </p>
                    ) : (
                      <SpeakerForm
                        sessionId={id}
                        participants={acceptedParticipantsForSpeakerSelection.map(
                          (participant) => ({
                            id: participant.id,
                            label: getParticipantLabel(
                              participant,
                              sessionOwnerId,
                            ),
                            role: participant.role,
                          }),
                        )}
                      />
                    )}
                  </div>
                </section>

                <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
                  <div className="mb-6 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                      Speakers
                    </p>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                      Speaker list
                    </h2>
                  </div>

                  {showSpeakersSetupState ? (
                    <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      Run the SQL in supabase/sessions.sql to enable speaker
                      storage.
                    </p>
                  ) : speakersError ? (
                    <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Failed to load speakers: {speakersError.message}
                    </p>
                  ) : (
                    <SpeakerList
                      speakers={speakers}
                      participantLabels={participantLabels}
                    />
                  )}
                </section>
              </section>
            </>
          )}
        </>
      ) : (
        <section className="rounded-4xl border border-black/8 bg-white/84 p-8 text-sm text-black/65 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
          Session not found or you do not have access.
        </section>
      )}
    </main>
  );
}
