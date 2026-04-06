"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import type { EvaluationMode, InvitationStatus, SpeakerRole } from "@/types";

export type SpeakerFormState = {
  errors?: {
    sessionParticipantId?: string;
    assignedEvaluatorParticipantId?: string;
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

export type DeleteInvitationState = {
  errors?: {
    form?: string;
  };
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

const initialDeleteInvitationState: DeleteInvitationState = {
  errors: {},
};

const validRoles: SpeakerRole[] = ["Speaker", "Evaluator"];

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

function isMissingAssignedEvaluatorColumn(error: { message?: string } | null) {
  return Boolean(
    error?.message?.includes("assigned_evaluator_participant_id"),
  );
}

function isMissingEvaluationModeColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("evaluation_mode"));
}

function isMissingInvitationStatusColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("status"));
}

function getInvitationStatus(record: {
  status?: string | null;
  accepted?: boolean | null;
}): InvitationStatus {
  if (record.status === "accepted" || record.status === "rejected") {
    return record.status;
  }

  return record.accepted ? "accepted" : "pending";
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

async function getAcceptedEvaluatorParticipant(
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
    .eq("role", "Evaluator")
    .maybeSingle();

  return { data, error };
}

async function getSessionEvaluationMode(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
) {
  const result = await supabase
    .from("sessions")
    .select("evaluation_mode")
    .eq("id", sessionId)
    .maybeSingle();

  if (isMissingEvaluationModeColumn(result.error)) {
    return {
      evaluationMode: "open" as EvaluationMode,
      error: null,
    };
  }

  return {
    evaluationMode:
      (result.data?.evaluation_mode as EvaluationMode | undefined) ?? "open",
    error: result.error,
  };
}

async function getAcceptedParticipantForUser(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("session_participants")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
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
  const assignedEvaluatorParticipantId =
    formData.get("assignedEvaluatorParticipantId")?.toString().trim() ?? "";
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
  const { evaluationMode } = await getSessionEvaluationMode(supabase, sessionId);

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

  if (evaluationMode === "assigned" && !assignedEvaluatorParticipantId) {
    return {
      errors: {
        assignedEvaluatorParticipantId:
          "Choose the evaluator assigned to this speaker.",
      },
    };
  }

  if (evaluationMode === "assigned" && assignedEvaluatorParticipantId) {
    const evaluatorLookup = await getAcceptedEvaluatorParticipant(
      supabase,
      sessionId,
      assignedEvaluatorParticipantId,
    );

    if (!evaluatorLookup.data) {
      return {
        errors: {
          assignedEvaluatorParticipantId:
            "Choose an accepted evaluator from this session.",
        },
      };
    }
  }

  let { error } = await supabase.from("speakers").insert({
    session_id: sessionId,
    session_participant_id: sessionParticipantId,
    assigned_evaluator_participant_id:
      evaluationMode === "assigned" ? assignedEvaluatorParticipantId : null,
    name,
    role,
    min_time: minTime,
    max_time: maxTime,
  });

  if (isMissingAssignedEvaluatorColumn(error)) {
    if (evaluationMode === "assigned") {
      return {
        errors: {
          form: "Assigned evaluator support is not set up in Supabase yet. Run the latest SQL migration and try again.",
        },
      };
    }

    const fallbackResult = await supabase.from("speakers").insert({
      session_id: sessionId,
      session_participant_id: sessionParticipantId,
      name,
      role,
      min_time: minTime,
      max_time: maxTime,
    });

    error = fallbackResult.error;
  }

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
  const { evaluationMode } = await getSessionEvaluationMode(supabase, sessionId);

  if (!canAccessSession) {
    return {
      errors: {
        form: "Only accepted participants or the session creator can submit feedback.",
      },
    };
  }

  const speakerResult = await supabase
    .from("speakers")
    .select("id, session_id, session_participant_id, assigned_evaluator_participant_id")
    .eq("id", speakerId)
    .eq("session_id", sessionId)
    .maybeSingle();

  const fallbackSpeakerResult = isMissingAssignedEvaluatorColumn(
    speakerResult.error,
  )
    ? await supabase
        .from("speakers")
        .select("id, session_id, session_participant_id")
        .eq("id", speakerId)
        .eq("session_id", sessionId)
        .maybeSingle()
    : null;

  const speaker = fallbackSpeakerResult
    ? fallbackSpeakerResult.data
    : speakerResult.data;
  const speakerError = fallbackSpeakerResult
    ? fallbackSpeakerResult.error
    : speakerResult.error;

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

  if (evaluationMode === "assigned") {
    const viewerParticipant = await getAcceptedParticipantForUser(
      supabase,
      sessionId,
      user.id,
    );

    if (
      !("assigned_evaluator_participant_id" in speaker) ||
      !speaker.assigned_evaluator_participant_id ||
      !viewerParticipant.data
    ) {
      return {
        errors: {
          form: "Only the assigned evaluator can submit feedback in assigned mode.",
        },
      };
    }

    if (
      String(viewerParticipant.data.id) !==
      String(speaker.assigned_evaluator_participant_id)
    ) {
      return {
        errors: {
          form: "Only the assigned evaluator can submit feedback in assigned mode.",
        },
      };
    }
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
      status: "pending",
    })
    .select("invite_token")
    .single();

  let invitationData = data;
  let invitationError = error;

  if (isMissingInvitationStatusColumn(error)) {
    const fallbackResult = await supabase
      .from("session_participants")
      .insert({
        session_id: sessionId,
        invited_email: inviteMode === "email" ? invitedEmail : null,
        role,
        accepted: false,
      })
      .select("invite_token")
      .single();

    invitationData = fallbackResult.data;
    invitationError = fallbackResult.error;
  }

  if (invitationError) {
    const isMissingTable =
      invitationError.code === "PGRST205" ||
      invitationError.message.includes("Could not find the table 'public.session_participants'");
    const isMissingInvitationColumns =
      invitationError.message.includes("invited_email") ||
      invitationError.message.includes("invite_token") ||
      invitationError.message.includes("accepted") ||
      invitationError.message.includes("role");
    const isBrokenPolicy = hasBrokenParticipantsPolicy(invitationError);

    return {
      errors: {
        form:
          isMissingTable || isMissingInvitationColumns || isBrokenPolicy
            ? "The invitation schema or participant policies are not set up yet. Run the SQL in supabase/sessions.sql and try again."
            : `Failed to save invitation: ${invitationError.message}`,
      },
    };
  }

  revalidatePath(`/session/${sessionId}`);

  if (inviteMode === "link") {
    return {
      errors: {},
      message: "Invite link generated with pending status.",
      inviteLink: `/invite/${invitationData.invite_token}`,
    };
  }

  return {
    errors: {},
    message: `Invitation saved for ${invitedEmail}.`,
  };
}

export async function deleteInvitation(
  sessionId: string,
  invitationId: string,
  _prevState: DeleteInvitationState = initialDeleteInvitationState,
): Promise<DeleteInvitationState> {
  void _prevState;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errors: {
        form: "You must be logged in to delete invitations.",
      },
    };
  }

  const isCreator = await userOwnsSession(supabase, sessionId, user.id);

  if (!isCreator) {
    return {
      errors: {
        form: "Only the session creator can delete invitations.",
      },
    };
  }

  const { data, error } = await supabase
    .from("session_participants")
    .select("id, accepted, status")
    .eq("id", invitationId)
    .eq("session_id", sessionId)
    .maybeSingle();

  let invitationData = data;
  let invitationError = error;

  if (isMissingInvitationStatusColumn(error)) {
    const fallbackResult = await supabase
      .from("session_participants")
      .select("id, accepted")
      .eq("id", invitationId)
      .eq("session_id", sessionId)
      .maybeSingle();

    invitationData = fallbackResult.data;
    invitationError = fallbackResult.error;
  }

  if (invitationError) {
    return {
      errors: {
        form: `Failed to load invitation: ${invitationError.message}`,
      },
    };
  }

  if (!invitationData) {
    return {
      errors: {
        form: "This invitation could not be found.",
      },
    };
  }

  if (getInvitationStatus(invitationData) !== "pending") {
    return {
      errors: {
        form: "Only pending invitations can be deleted.",
      },
    };
  }

  const { error: deleteError } = await supabase
    .from("session_participants")
    .delete()
    .eq("id", invitationId)
    .eq("session_id", sessionId);

  if (deleteError) {
    return {
      errors: {
        form: `Failed to delete invitation: ${deleteError.message}`,
      },
    };
  }

  revalidatePath("/");
  revalidatePath(`/session/${sessionId}`);

  return initialDeleteInvitationState;
}