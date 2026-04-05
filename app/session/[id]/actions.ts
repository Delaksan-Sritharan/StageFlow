"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { SpeakerRole } from "@/types";

export type SpeakerFormState = {
  errors?: {
    name?: string;
    role?: string;
    minTime?: string;
    maxTime?: string;
    form?: string;
  };
};

export type FeedbackFormState = {
  errors?: {
    contentScore?: string;
    deliveryScore?: string;
    confidenceScore?: string;
    form?: string;
  };
};

const initialState: SpeakerFormState = {
  errors: {},
};

const initialFeedbackState: FeedbackFormState = {
  errors: {},
};

const validRoles: SpeakerRole[] = ["Speaker", "Evaluator", "Table Topics"];

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number.parseInt(value, 10);
}

function parseScore(value: string) {
  const parsed = parsePositiveInteger(value);

  if (parsed === null || parsed < 1 || parsed > 10) {
    return null;
  }

  return parsed;
}

export async function addSpeaker(
  sessionId: string,
  _prevState: SpeakerFormState = initialState,
  formData: FormData,
): Promise<SpeakerFormState> {
  void _prevState;

  const name = formData.get("name")?.toString().trim() ?? "";
  const role = formData.get("role")?.toString().trim() ?? "";
  const minTimeValue = formData.get("minTime")?.toString().trim() ?? "";
  const maxTimeValue = formData.get("maxTime")?.toString().trim() ?? "";

  const minTime = parsePositiveInteger(minTimeValue);
  const maxTime = parsePositiveInteger(maxTimeValue);

  const errors: SpeakerFormState["errors"] = {};

  if (!name) {
    errors.name = "Speaker name is required.";
  }

  if (!validRoles.includes(role as SpeakerRole)) {
    errors.role = "Choose a valid role.";
  }

  if (minTime === null) {
    errors.minTime = "Minimum time must be a whole number of seconds.";
  }

  if (maxTime === null) {
    errors.maxTime = "Maximum time must be a whole number of seconds.";
  }

  if (minTime !== null && maxTime !== null && maxTime < minTime) {
    errors.maxTime = "Maximum time must be greater than or equal to minimum time.";
  }

  if (errors.name || errors.role || errors.minTime || errors.maxTime) {
    return { errors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errors: {
        form: "You must be logged in to add speakers.",
      },
    };
  }

  const { error } = await supabase.from("speakers").insert({
    session_id: sessionId,
    name,
    role,
    min_time: minTime,
    max_time: maxTime,
  });

  if (error) {
    const isMissingTable =
      error.code === "PGRST205" ||
      error.message.includes("Could not find the table 'public.speakers'");

    return {
      errors: {
        form: isMissingTable
          ? "The speakers table is not set up yet. Run the SQL in supabase/sessions.sql and try again."
          : `Failed to save speaker: ${error.message}`,
      },
    };
  }

  revalidatePath(`/session/${sessionId}`);

  return initialState;
}

export async function submitFeedback(
  sessionId: string,
  speakerId: string,
  _prevState: FeedbackFormState = initialFeedbackState,
  formData: FormData,
): Promise<FeedbackFormState> {
  void _prevState;

  const contentScoreValue = formData.get("contentScore")?.toString().trim() ?? "";
  const deliveryScoreValue = formData.get("deliveryScore")?.toString().trim() ?? "";
  const confidenceScoreValue =
    formData.get("confidenceScore")?.toString().trim() ?? "";
  const comment = formData.get("comment")?.toString().trim() ?? "";

  const contentScore = parseScore(contentScoreValue);
  const deliveryScore = parseScore(deliveryScoreValue);
  const confidenceScore = parseScore(confidenceScoreValue);

  const errors: FeedbackFormState["errors"] = {};

  if (contentScore === null) {
    errors.contentScore = "Content score must be between 1 and 10.";
  }

  if (deliveryScore === null) {
    errors.deliveryScore = "Delivery score must be between 1 and 10.";
  }

  if (confidenceScore === null) {
    errors.confidenceScore = "Confidence score must be between 1 and 10.";
  }

  if (errors.contentScore || errors.deliveryScore || errors.confidenceScore) {
    return { errors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errors: {
        form: "You must be logged in to submit feedback.",
      },
    };
  }

  const { error } = await supabase.from("feedback").insert({
    speaker_id: speakerId,
    content_score: contentScore,
    delivery_score: deliveryScore,
    confidence_score: confidenceScore,
    comment: comment || null,
  });

  if (error) {
    const isMissingTable =
      error.code === "PGRST205" ||
      error.message.includes("Could not find the table 'public.feedback'");

    return {
      errors: {
        form: isMissingTable
          ? "The feedback table is not set up yet. Run the SQL in supabase/sessions.sql and try again."
          : `Failed to save feedback: ${error.message}`,
      },
    };
  }

  revalidatePath(`/session/${sessionId}`);

  return initialFeedbackState;
}