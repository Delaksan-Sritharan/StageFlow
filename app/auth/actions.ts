"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export type AuthFormState = {
  errors?: {
    displayName?: string;
    email?: string;
    password?: string;
    form?: string;
  };
};

const initialState: AuthFormState = {
  errors: {},
};

function getSafeRedirectPath(value: FormDataEntryValue | string | null | undefined) {
  const rawValue = typeof value === "string" ? value : value?.toString() ?? "";

  if (!rawValue || !rawValue.startsWith("/") || rawValue.startsWith("//")) {
    return "/";
  }

  return rawValue;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCredentials(
  email: string,
  password: string,
  displayName?: string,
) {
  const errors: AuthFormState["errors"] = {};

  if (displayName !== undefined && displayName.length > 0 && displayName.length < 2) {
    errors.displayName = "Display name must be at least 2 characters long.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  return errors;
}

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