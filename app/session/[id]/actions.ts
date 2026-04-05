"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { SpeakerRole } from "@/types";

export type SpeakerFormState = {
  errors?: {
    sessionParticipantId?: string;
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

export type InviteParticipantFormState = {
  errors?: {
    invitedEmail?: string;
    role?: string;
    form?: string;
  };
  message?: string;
  inviteLink?: string;
};

const initialState: SpeakerFormState = {
  errors: {},
};

const initialFeedbackState: FeedbackFormState = {
  errors: {},
};

const initialInviteState: InviteParticipantFormState = {
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isMissingCreatorIdColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("creator_id"));
}

function hasBrokenParticipantsPolicy(error: { message?: string } | null) {
  return Boolean(
    error?.message?.includes(
      'infinite recursion detected in policy for relation "session_participants"',
    ),
  );
}

async function userOwnsSession(supabase: ReturnType<typeof createClient>, sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("creator_id", userId)
    .maybeSingle();

  let ownedSession = data;

  if (isMissingCreatorIdColumn(error)) {
    const fallbackResult = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    ownedSession = fallbackResult.data;
  }

  return Boolean(ownedSession);
}

async function userCanAccessSession(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  userId: string,
) {
  if (await userOwnsSession(supabase, sessionId, userId)) {
    return true;
  }

  const { data } = await supabase
    .from("session_participants")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("accepted", true)
    .maybeSingle();

  return Boolean(data);
}

async function getAcceptedSessionParticipant(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  sessionParticipantId: string,
) {
  const { data, error } = await supabase
    .from("session_participants")
    .select("id")
    .eq("id", sessionParticipantId)
    .eq("session_id", sessionId)
    .eq("accepted", true)
    .maybeSingle();

  return { data, error };
}

export async function addSpeaker(
  sessionId: string,
  _prevState: SpeakerFormState = initialState,
  formData: FormData,
): Promise<SpeakerFormState> {
  void _prevState;

  const name = formData.get("name")?.toString().trim() ?? "";
  const sessionParticipantId =
    formData.get("sessionParticipantId")?.toString().trim() ?? "";
  const role = formData.get("role")?.toString().trim() ?? "";
  const minTimeValue = formData.get("minTime")?.toString().trim() ?? "";
  const maxTimeValue = formData.get("maxTime")?.toString().trim() ?? "";

  const minTime = parsePositiveInteger(minTimeValue);
  const maxTime = parsePositiveInteger(maxTimeValue);

  const errors: SpeakerFormState["errors"] = {};

  if (!sessionParticipantId) {
    errors.sessionParticipantId = "Choose the participant who is being evaluated.";
  }

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

  if (
    errors.sessionParticipantId ||
    errors.name ||
    errors.role ||
    errors.minTime ||
    errors.maxTime
  ) {
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

  const isCreator = await userOwnsSession(supabase, sessionId, user.id);

  if (!isCreator) {
    return {
      errors: {
        form: "Only the session creator can add speakers.",
      },
    };
  }

  const participantLookup = await getAcceptedSessionParticipant(
    supabase,
    sessionId,
    sessionParticipantId,
  );

  if (!participantLookup.data) {
    return {
      errors: {
        form: "Choose an accepted participant from this session.",
      },
    };
  }

  const { error } = await supabase.from("speakers").insert({
    session_id: sessionId,
    session_participant_id: sessionParticipantId,
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
  const sessionParticipantId =
    formData.get("sessionParticipantId")?.toString().trim() ?? "";

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

  if (!sessionParticipantId) {
    return {
      errors: {
        form: "This speaker is not linked to an accepted participant yet.",
      },
    };
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

  const canAccessSession = await userCanAccessSession(supabase, sessionId, user.id);

  if (!canAccessSession) {
    return {
      errors: {
        form: "Only accepted participants or the session creator can submit feedback.",
      },
    };
  }

  const { data: speaker, error: speakerError } = await supabase
    .from("speakers")
    .select("id, session_id, session_participant_id")
    .eq("id", speakerId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (speakerError) {
    return {
      errors: {
        form: `Failed to validate speaker: ${speakerError.message}`,
      },
    };
  }

  if (!speaker) {
    return {
      errors: {
        form: "This speaker could not be found for the current session.",
      },
    };
  }

  if (!speaker.session_participant_id) {
    return {
      errors: {
        form: "This speaker must be linked to an accepted participant before feedback can be saved.",
      },
    };
  }

  if (String(speaker.session_participant_id) !== sessionParticipantId) {
    return {
      errors: {
        form: "Feedback must target the participant linked to this speaker.",
      },
    };
  }

  const { error } = await supabase.from("feedback").insert({
    speaker_id: speakerId,
    session_participant_id: sessionParticipantId,
    user_id: user.id,
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

export async function createInvitation(
  sessionId: string,
  _prevState: InviteParticipantFormState = initialInviteState,
  formData: FormData,
): Promise<InviteParticipantFormState> {
  void _prevState;

  const inviteMode = formData.get("inviteMode")?.toString() === "link" ? "link" : "email";
  const invitedEmail = formData.get("invitedEmail")?.toString().trim().toLowerCase() ?? "";
  const role = formData.get("role")?.toString().trim() ?? "";

  const errors: InviteParticipantFormState["errors"] = {};

  if (!validRoles.includes(role as SpeakerRole)) {
    errors.role = "Choose a valid role.";
  }

  if (inviteMode === "email" && !invitedEmail) {
    errors.invitedEmail = "Email is required when saving an email invite.";
  } else if (invitedEmail && !isValidEmail(invitedEmail)) {
    errors.invitedEmail = "Enter a valid email address.";
  }

  if (errors.invitedEmail || errors.role) {
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
        form: "You must be logged in to create invitations.",
      },
    };
  }

  const isCreator = await userOwnsSession(supabase, sessionId, user.id);

  if (!isCreator) {
    return {
      errors: {
        form: "Only the session creator can invite participants.",
      },
    };
  }

  const { data, error } = await supabase
    .from("session_participants")
    .insert({
      session_id: sessionId,
      invited_email: inviteMode === "email" ? invitedEmail : null,
      role,
      accepted: false,
    })
    .select("invite_token")
    .single();

  if (error) {
    const isMissingTable =
      error.code === "PGRST205" ||
      error.message.includes("Could not find the table 'public.session_participants'");
    const isMissingInvitationColumns =
      error.message.includes("invited_email") ||
      error.message.includes("invite_token") ||
      error.message.includes("accepted") ||
      error.message.includes("role");
    const isBrokenPolicy = hasBrokenParticipantsPolicy(error);

    return {
      errors: {
        form:
          isMissingTable || isMissingInvitationColumns || isBrokenPolicy
            ? "The invitation schema or participant policies are not set up yet. Run the SQL in supabase/sessions.sql and try again."
            : `Failed to save invitation: ${error.message}`,
      },
    };
  }

  revalidatePath(`/session/${sessionId}`);

  if (inviteMode === "link") {
    return {
      errors: {},
      message: "Invite link generated.",
      inviteLink: `/invite/${data.invite_token}`,
    };
  }

  return {
    errors: {},
    message: `Invitation saved for ${invitedEmail}.`,
  };
}