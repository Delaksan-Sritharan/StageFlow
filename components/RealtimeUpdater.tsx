"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

type RealtimeUpdaterProps = {
  sessionId: string;
  speakerIds: string[];
};

export function RealtimeUpdater({
  sessionId,
  speakerIds,
}: RealtimeUpdaterProps) {
  const router = useRouter();

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;

    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`session-realtime-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "speakers",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          router.refresh();
        },
      );

    // Subscribe to feedback for each speaker
    if (speakerIds.length > 0) {
      speakerIds.forEach((speakerId) => {
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "feedback",
            filter: `speaker_id=eq.${speakerId}`,
          },
          () => {
            router.refresh();
          },
        );
      });
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, speakerIds, router]);

  return null;
}
