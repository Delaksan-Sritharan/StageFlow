import Link from "next/link";
import { cookies } from "next/headers";

import { SessionSummary } from "@/components/SessionSummary";
import type { Feedback, SessionParticipant, Speaker } from "@/types";
import { createClient } from "@/utils/supabase/server";

type SessionSummaryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isMissingTable(
  error: { code?: string; message?: string } | null,
  tableName: string,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes(`Could not find the table 'public.${tableName}'`)
  );
}

export default async function SessionSummaryPage({
  params,
}: SessionSummaryPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  const sessionOwnerId = session
    ? (session.creator_id ?? session.user_id ?? null)
    : null;
  const isCreator = sessionOwnerId === user?.id;

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

  const participantUserIds = (participantsData ?? [])
    .map((p) => p.user_id)
    .filter(Boolean) as string[];
  const { data: usersData } = participantUserIds.length
    ? await supabase
        .from("users")
        .select("id, email, display_name")
        .in("id", participantUserIds)
    : { data: [] };

  const showSetupState =
    isMissingTable(sessionError, "sessions") ||
    isMissingTable(participantsError, "session_participants") ||
    isMissingTable(speakersError, "speakers") ||
    isMissingTable(feedbackError, "feedback");

  const speakers: Speaker[] =
    speakersData?.map((speaker) => ({
      id: String(speaker.id),
      sessionId: String(speaker.session_id),
      sessionParticipantId: speaker.session_participant_id
        ? String(speaker.session_participant_id)
        : null,
      assignedEvaluatorParticipantId: null,
      name: speaker.name,
      role: speaker.role,
      minTime: speaker.min_time,
      maxTime: speaker.max_time,
    })) ?? [];

  const participants: SessionParticipant[] =
    participantsData?.map((participant) => ({
      id: String(participant.id),
      sessionId: String(participant.session_id),
      userId: participant.user_id ? String(participant.user_id) : null,
      invitedEmail: participant.invited_email ?? null,
      role: participant.role ?? null,
      accepted: participant.accepted ?? true,
      status:
        participant.status === "accepted" || participant.status === "rejected"
          ? participant.status
          : participant.accepted
            ? "accepted"
            : "pending",
      inviteToken: participant.invite_token ?? null,
    })) ?? [];

  const userNameMap = Object.fromEntries(
    (usersData ?? []).map((u) => [
      String(u.id),
      (u.display_name as string | null) ?? (u.email as string | null) ?? null,
    ]),
  );

  const authorLabels: Record<string, string> = {};

  if (sessionOwnerId) {
    authorLabels[sessionOwnerId] =
      userNameMap[sessionOwnerId] ?? "Session creator";
  }

  for (const participant of participants) {
    if (!participant.userId) continue;
    authorLabels[participant.userId] =
      userNameMap[participant.userId] ??
      participant.invitedEmail ??
      participant.role ??
      "Participant";
  }

  const feedbackBySpeaker = new Map<string, Feedback[]>();

  feedbackData?.forEach((entry) => {
    const speakerId = String(entry.speaker_id);
    const existing = feedbackBySpeaker.get(speakerId) ?? [];

    existing.push({
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

    feedbackBySpeaker.set(speakerId, existing);
  });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <section className="rounded-4xl border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
              StageFlow / Session summary
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black">
              {session?.title ?? `Session ${id}`}
            </h1>
            {session ? (
              <p className="text-sm leading-7 text-black/62">
                {new Date(`${session.date}T00:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/session/${id}`}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
            >
              Back to session
            </Link>
            <Link
              href="/session/create"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
            >
              Create another session
            </Link>
          </div>
        </div>
      </section>

      {showSetupState ? (
        <section className="rounded-4xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-950 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Run the SQL in supabase/sessions.sql to make sure the sessions,
          speakers, and feedback tables all exist.
        </section>
      ) : sessionError ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Failed to load session: {sessionError.message}
        </section>
      ) : speakersError ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Failed to load speakers: {speakersError.message}
        </section>
      ) : feedbackError ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Failed to load feedback: {feedbackError.message}
        </section>
      ) : participantsError ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Failed to load participants: {participantsError.message}
        </section>
      ) : !session ? (
        <section className="rounded-4xl border border-black/8 bg-white/84 p-8 text-sm text-black/65 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
          Session not found or you do not have access.
        </section>
      ) : !isCreator ? (
        <section className="rounded-4xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          Only the session creator can view the full feedback summary.
        </section>
      ) : (
        <SessionSummary
          speakers={speakers}
          feedbackBySpeaker={feedbackBySpeaker}
          authorLabels={authorLabels}
        />
      )}
    </main>
  );
}
