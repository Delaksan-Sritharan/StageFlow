"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import type { SpeakerRole } from "@/types";

export type AcceptInvitationState = {
  errors?: {
    role?: string;
    form?: string;
  };
};

const initialState: AcceptInvitationState = {
  errors: {},
};

const validRoles: SpeakerRole[] = ["Speaker", "Evaluator"];

function isMissingInvitationRpc(error: { code?: string; message?: string } | null) {
  return Boolean(
    error?.code === "PGRST202" ||
      error?.message?.includes("get_session_invitation") ||
      error?.message?.includes("accept_session_invitation"),
  );
}

export async function acceptInvitation(
  token: string,
  _prevState: AcceptInvitationState = initialState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  void _prevState;

  const role = formData.get("role")?.toString().trim() ?? "";

  if (role && !validRoles.includes(role as SpeakerRole)) {
    return {
      errors: {
        role: "Choose a valid role.",
      },
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const { data, error } = await supabase.rpc("accept_session_invitation", {
    target_invite_token: token,
    selected_role: role || null,
  });

  if (error) {
    return {
      errors: {
        form: isMissingInvitationRpc(error)
          ? "The invite join flow is not set up yet. Run supabase/enable-invite-join-links.sql and try again."
          : error.message,
      },
    };
  }

  const sessionId = Array.isArray(data) ? data[0] : data;

  if (!sessionId) {
    return {
      errors: {
        form: "Failed to accept invitation.",
      },
    };
  }

  revalidatePath("/");
  revalidatePath(`/invite/${token}`);
  revalidatePath(`/session/${sessionId}`);
  redirect(`/session/${sessionId}`);
}