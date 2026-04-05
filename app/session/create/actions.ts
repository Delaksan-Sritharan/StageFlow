"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export type SessionFormState = {
  errors?: {
    title?: string;
    date?: string;
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

  const errors: SessionFormState["errors"] = {};

  if (!title) {
    errors.title = "Session title is required.";
  }

  if (!date) {
    errors.date = "Date is required.";
  } else if (!isValidDate(date)) {
    errors.date = "Enter a valid date.";
  }

  if (errors.title || errors.date) {
    return { errors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("sessions")
    .insert({ title, date })
    .select("id")
    .single();

  if (error) {
    const isMissingTable =
      error.code === "PGRST205" ||
      error.message.includes("Could not find the table 'public.sessions'");

    return {
      errors: {
        form: isMissingTable
          ? "The sessions table is not set up yet. Run the SQL in supabase/sessions.sql and try again."
          : `Failed to save session: ${error.message}`,
      },
    };
  }

  revalidatePath("/");
  revalidatePath("/session/create");
  redirect(`/session/${data.id}`);
}