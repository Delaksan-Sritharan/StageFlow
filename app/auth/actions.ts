"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import {
  getSafeRedirectPath,
  type AuthFormState,
  validateCredentials,
} from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

const initialState: AuthFormState = {
  errors: {},
};

export async function signUp(
  _prevState: AuthFormState = initialState,
  formData: FormData,
): Promise<AuthFormState> {
  void _prevState;

  const displayName = formData.get("displayName")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));
  const errors = validateCredentials(email, password, displayName);

  if (errors.displayName || errors.email || errors.password) {
    return { errors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || null,
      },
    },
  });

  if (error) {
    return {
      errors: {
        form: error.message,
      },
    };
  }

  if (!data.session) {
    const params = new URLSearchParams({
      message: "Check your email to confirm your account.",
    });

    if (redirectTo !== "/") {
      params.set("redirectTo", redirectTo);
    }

    redirect(`/login?${params.toString()}`);
  }

  redirect(redirectTo);
}

export async function login(
  _prevState: AuthFormState = initialState,
  formData: FormData,
): Promise<AuthFormState> {
  void _prevState;

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));
  const errors = validateCredentials(email, password);

  if (errors.email || errors.password) {
    return { errors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      errors: {
        form: error.message,
      },
    };
  }

  redirect(redirectTo);
}

export async function logout() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();
  redirect("/login");
}