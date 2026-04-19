"use server";

import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export async function startTimerAction(
  sessionId: string,
  speakerId: string,
  startedByName: string,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("speaker_timer_states").upsert(
    {
      speaker_id: speakerId,
      session_id: sessionId,
      is_running: true,
      started_at: new Date().toISOString(),
      started_by_user_id: user.id,
      started_by_name: startedByName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "speaker_id" },
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function pauseTimerAction(
  sessionId: string,
  speakerId: string,
  pausedElapsedMs: number,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("speaker_timer_states").upsert(
    {
      speaker_id: speakerId,
      session_id: sessionId,
      is_running: false,
      paused_elapsed_ms: pausedElapsedMs,
      started_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "speaker_id" },
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function resetTimerAction(
  sessionId: string,
  speakerId: string,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("speaker_timer_states").upsert(
    {
      speaker_id: speakerId,
      session_id: sessionId,
      is_running: false,
      is_finished: false,
      paused_elapsed_ms: 0,
      started_at: null,
      started_by_user_id: null,
      started_by_name: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "speaker_id" },
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function finishSpeakerTimerAction(
  sessionId: string,
  speakerId: string,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("speaker_timer_states").upsert(
    {
      speaker_id: speakerId,
      session_id: sessionId,
      is_running: false,
      is_finished: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "speaker_id" },
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
