import Link from "next/link";
import { cookies } from "next/headers";

import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackList } from "@/components/FeedbackList";
import { SpeakerForm } from "@/components/SpeakerForm";
import { SpeakerList } from "@/components/SpeakerList";
import type { Feedback, Speaker } from "@/types";
import { createClient } from "@/utils/supabase/server";

type SessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, title, date")
    .eq("id", id)
    .single();
  const { data: speakersData, error: speakersError } = await supabase
    .from("speakers")
    .select("id, session_id, name, role, min_time, max_time")
    .eq("session_id", id)
    .order("created_at", { ascending: true });
  const { data: feedbackData, error: feedbackError } = await supabase
    .from("feedback")
    .select(
      "id, speaker_id, content_score, delivery_score, confidence_score, comment, created_at",
    )
    .order("created_at", { ascending: false });

  const showSetupState = isMissingSessionsTable(error);
  const showSpeakersSetupState = isMissingSpeakersTable(speakersError);
  const showFeedbackSetupState = isMissingFeedbackTable(feedbackError);
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
    const speakerFeedback = feedbackBySpeaker.get(speakerId) ?? [];

    speakerFeedback.push({
      id: String(entry.id),
      speakerId,
      contentScore: entry.content_score,
      deliveryScore: entry.delivery_score,
      confidenceScore: entry.confidence_score,
      comment: entry.comment,
      createdAt: entry.created_at,
    });

    feedbackBySpeaker.set(speakerId, speakerFeedback);
  });

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

          <Link
            href="/session/create"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
          >
            Create another session
          </Link>
          <Link
            href={`/session/${id}/summary`}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-black/3"
          >
            Open summary
          </Link>
        </div>
      </section>

      {showSetupState ? (
        <section className="rounded-4xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-950 shadow-[0_24px_90px_rgba(15,23,42,0.04)]">
          <h2 className="text-lg font-semibold text-black">
            The sessions table is not set up yet.
          </h2>
          <p className="mt-3 leading-7 text-black/70">
            Run the SQL in supabase/sessions.sql, then reload this page.
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
                  Add as many speakers as you need for this session with role
                  and timing windows.
                </p>
              </div>

              <div className="mt-6">
                {showSpeakersSetupState ? (
                  <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    The speakers table is not set up yet. Run the SQL in
                    supabase/sessions.sql and reload this page.
                  </p>
                ) : speakersError ? (
                  <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Failed to load speakers: {speakersError.message}
                  </p>
                ) : (
                  <SpeakerForm sessionId={id} />
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
                <SpeakerList speakers={speakers} />
              )}
            </section>
          </section>

          <section className="rounded-4xl border border-black/8 bg-white/84 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="mb-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/42">
                Feedback
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-black">
                Speaker feedback
              </h2>
              <p className="text-sm leading-7 text-black/62">
                Submit feedback for each speaker using simple scores and an
                optional comment.
              </p>
            </div>

            {showFeedbackSetupState ? (
              <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                The feedback table is not set up yet. Run the SQL in
                supabase/sessions.sql and reload this page.
              </p>
            ) : feedbackError ? (
              <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Failed to load feedback: {feedbackError.message}
              </p>
            ) : speakers.length === 0 ? (
              <p className="rounded-3xl border border-black/8 bg-white/75 px-4 py-3 text-sm text-black/62">
                Add at least one speaker before submitting feedback.
              </p>
            ) : (
              <div className="space-y-5">
                {speakers.map((speaker) => (
                  <article
                    key={speaker.id}
                    className="rounded-4xl border border-black/8 bg-white/88 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xl font-semibold tracking-[-0.03em] text-black">
                          {speaker.name}
                        </p>
                        <p className="mt-1 text-sm text-black/58">
                          {speaker.role}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                      <div>
                        <FeedbackForm sessionId={id} speakerId={speaker.id} />
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold tracking-[-0.01em] text-black">
                          Submitted feedback
                        </p>
                        <FeedbackList
                          feedback={feedbackBySpeaker.get(speaker.id) ?? []}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-4xl border border-black/8 bg-white/84 p-8 text-sm text-black/65 shadow-[0_24px_90px_rgba(15,23,42,0.06)] backdrop-blur">
          Session not found.
        </section>
      )}
    </main>
  );
}
