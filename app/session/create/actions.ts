"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

const validEvaluationModes = ["open", "assigned"] as const;

type EvaluationMode = (typeof validEvaluationModes)[number];

function isMissingCreatorIdColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("creator_id"));
}

function isMissingEvaluationModeColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("evaluation_mode"));
}

function isSessionsInsertPolicyMismatch(error: {
  code?: string;
  message?: string;
} | null) {
  return Boolean(
    error?.code === "42501" ||
      error?.message?.includes(
        'new row violates row-level security policy for table "sessions"',
      ),
  );
}

async function insertSessionWithCompatibility(
  supabase: ReturnType<typeof createClient>,
  values: { title: string; date: string; evaluation_mode: EvaluationMode },
  userId: string,
) {
  const attempts: Array<{
    payload: Record<string, string>;
    requiresEvaluationMode: boolean;
  }> = [
    {
      payload: { ...values, creator_id: userId, user_id: userId },
      requiresEvaluationMode: true,
    },
    {
      payload: { ...values, creator_id: userId },
      requiresEvaluationMode: true,
    },
    {
      payload: { ...values, user_id: userId },
      requiresEvaluationMode: true,
    },
    ...(values.evaluation_mode === "open"
      ? [
          {
            payload: { title: values.title, date: values.date, creator_id: userId, user_id: userId },
            requiresEvaluationMode: false,
          },
          {
            payload: { title: values.title, date: values.date, creator_id: userId },
            requiresEvaluationMode: false,
          },
          {
            payload: { title: values.title, date: values.date, user_id: userId },
            requiresEvaluationMode: false,
          },
        ]
      : []),
  ];

  let lastResult: {
    data: { id: string } | null;
    error: { code?: string; message?: string } | null;
  } = {
    data: null,
    error: null,
  };

  for (const attempt of attempts) {
    const result = await supabase.from("sessions").insert(attempt.payload);

    lastResult = {
      data: null,
      error: result.error,
    };

    if (!result.error) {
      return lastResult;
    }

    const shouldContinue =
      isMissingCreatorIdColumn(result.error) ||
      isSessionsInsertPolicyMismatch(result.error) ||
      (attempt.requiresEvaluationMode &&
        isMissingEvaluationModeColumn(result.error));

    if (!shouldContinue) {
      return lastResult;
    }
  }

  return lastResult;
}

async function findRecentlyCreatedSessionId(
  supabase: ReturnType<typeof createClient>,
  values: { title: string; date: string; evaluation_mode: EvaluationMode },
  createdAfter: string,
  userId: string,
) {
  const ownerFilters = [
    `creator_id.eq.${userId}`,
    `user_id.eq.${userId}`,
  ];

  const { data, error } = await supabase
    .from("sessions")
    .select("id, created_at")
    .eq("title", values.title)
    .eq("date", values.date)
    .gte("created_at", createdAfter)
    .or(ownerFilters.join(","))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    data: data ? { id: String(data.id) } : null,
    error,
  };
}

export type SessionFormState = {
  errors?: {
    title?: string;
    date?: string;
    evaluationMode?: string;
    form?: string;
  };
};

const initialState: SessionFormState = {
  errors: {},
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function createSession(
  _prevState: SessionFormState = initialState,
  formData: FormData,
): Promise<SessionFormState> {
  void _prevState;

  const title = formData.get("title")?.toString().trim() ?? "";
  const date = formData.get("date")?.toString().trim() ?? "";
  const evaluationModeValue =
    formData.get("evaluationMode")?.toString().trim() ?? "open";

  const errors: SessionFormState["errors"] = {};

  if (!title) {
    errors.title = "Session title is required.";
  }

  if (!date) {
    errors.date = "Date is required.";
  } else if (!isValidDate(date)) {
    errors.date = "Enter a valid date.";
  }

  if (!validEvaluationModes.includes(evaluationModeValue as EvaluationMode)) {
    errors.evaluationMode = "Choose a valid evaluation mode.";
  }

  if (errors.title || errors.date || errors.evaluationMode) {
    return { errors };
  }

  const evaluationMode = evaluationModeValue as EvaluationMode;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errors: {
        form: "You must be logged in to create a session.",
      },
    };
  }

  const createdAfter = new Date().toISOString();
  const insertResult = await insertSessionWithCompatibility(
    supabase,
    { title, date, evaluation_mode: evaluationMode },
    user.id,
  );

  let data = insertResult.data;
  let error = insertResult.error;

  if (!error) {
    const fetchResult = await findRecentlyCreatedSessionId(
      supabase,
      { title, date, evaluation_mode: evaluationMode },
      createdAfter,
      user.id,
    );

    data = fetchResult.data;
    error = fetchResult.error;
  }

  if (error) {
    const isMissingTable =
      error.code === "PGRST205" ||
      error.message?.includes("Could not find the table 'public.sessions'");
    const missingEvaluationMode = isMissingEvaluationModeColumn(error);

    return {
      errors: {
        form: isMissingTable
          ? "The sessions table is not set up yet. Run the SQL in supabase/sessions.sql and try again."
          : missingEvaluationMode && evaluationMode === "assigned"
            ? "Assigned evaluation mode is not set up in Supabase yet. Run supabase/enable-assigned-evaluation-mode.sql and try again."
          : isSessionsInsertPolicyMismatch(error)
            ? "The session insert policy in Supabase is still outdated. Run supabase/fix-session-participant-policies.sql and try again."
          : `Failed to save session: ${error.message}`,
      },
    };
  }

  if (!data) {
    return {
      errors: {
        form: "Failed to save session.",
      },
    };
  }

  revalidatePath("/");
  revalidatePath("/session/create");
  redirect(`/session/${data.id}`);
}