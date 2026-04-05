"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

function isMissingCreatorIdColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("creator_id"));
}

export async function deleteSession(formData: FormData) {
  const sessionId = formData.get("sessionId")?.toString();

  if (!sessionId) {
    return;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("creator_id", user.id);

  if (isMissingCreatorIdColumn(error)) {
    await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);
  }

  revalidatePath("/");
}