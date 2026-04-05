import Link from "next/link";
import { cookies } from "next/headers";

import { SessionSummary } from "@/components/SessionSummary";
import type { Feedback, Speaker } from "@/types";
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

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, title, date")
    .eq("id", id)
    .single();

  const { data: speakersData, error: speakersError } = await supabase
    .from("speakers")
    .select("id, session_id, name, role, min_time, max_time")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const speakerIds = speakersData?.map((speaker) => speaker.id) ?? [];

  const { data: feedbackData, error: feedbackError } = speakerIds.length
    ? await supabase
        .from("feedback")
        .select(
          "id, speaker_id, content_score, delivery_score, confidence_score, comment, created_at",
        )
        .in("speaker_id", speakerIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const showSetupState =
    isMissingTable(sessionError, "sessions") ||
    isMissingTable(speakersError, "speakers") ||
    isMissingTable(feedbackError, "feedback");

  const speakers: Speaker[] =
    speakersData?.map((speaker) => ({
      id: String(speaker.id),
      sessionId: String(speaker.session_id),
      name: speaker.name,
      role: speaker.role,
      minTime: speaker.min_time,
      maxTime: speaker.max_time,
    })) ?? [];

  const feedbackBySpeaker = new Map<string, Feedback[]>();

  feedbackData?.forEach((entry) => {
    const speakerId = String(entry.speaker_id);
    const existing = feedbackBySpeaker.get(speakerId) ?? [];

    existing.push({
      id: String(entry.id),
      speakerId,
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
      ) : (
        <SessionSummary
          speakers={speakers}
          feedbackBySpeaker={feedbackBySpeaker}
        />
      )}
    </main>
  );
}
