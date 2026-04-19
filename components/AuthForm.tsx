"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  getSafeRedirectPath,
  type AuthFormState,
  validateCredentials,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  redirectTo?: string;
};

const initialState: AuthFormState = {
  errors: {},
};

function SubmitButton({
  mode,
  pending,
  disabled,
}: {
  mode: AuthMode;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
    >
      {pending
        ? "Please wait..."
        : mode === "signup"
          ? "Create account"
          : "Log in"}
    </button>
  );
}

function buildAuthHref(pathname: string, redirectTo?: string) {
  if (!redirectTo) {
    return pathname;
  }

  return `${pathname}?redirectTo=${encodeURIComponent(redirectTo)}`;
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const authConfigured = isSupabaseConfigured();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authConfigured) {
      setState({
        errors: {
          form: "Supabase auth is not configured for this app. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the Next server.",
        },
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const displayName = formData.get("displayName")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const safeRedirectTo = getSafeRedirectPath(
      redirectTo ?? formData.get("redirectTo"),
    );
    const errors = validateCredentials(
      email,
      password,
      mode === "signup" ? displayName : undefined,
    );

    if (errors.displayName || errors.email || errors.password) {
      setState({ errors });
      return;
    }

    setState(initialState);

    try {
      const supabase = createClient();

      if (mode === "signup") {
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
          setState({
            errors: {
              form: error.message,
            },
          });
          return;
        }

        if (!data.session) {
          const params = new URLSearchParams({
            message: "Check your email to confirm your account.",
          });

          if (safeRedirectTo !== "/") {
            params.set("redirectTo", safeRedirectTo);
          }

          startTransition(() => {
            router.replace(`/login?${params.toString()}`);
          });
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const isInvalidCredentials =
            error.message.toLowerCase().includes("invalid login credentials");
          setState({
            errors: {
              form: isInvalidCredentials
                ? "Invalid email or password. If you just signed up, please confirm your email first."
                : error.message,
            },
          });
          return;
        }
      }

      startTransition(() => {
        router.replace(safeRedirectTo);
      });
    } catch (error) {
      setState({
        errors: {
          form:
            error instanceof Error
              ? error.message
              : "Something went wrong while contacting Supabase.",
        },
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      {mode === "signup" ? (
        <div className="space-y-2">
          <label
            htmlFor="displayName"
            className="text-sm font-semibold tracking-[-0.01em] text-black"
          >
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            placeholder="Optional"
            className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
          />
          {state.errors?.displayName ? (
            <p className="text-sm text-rose-600">{state.errors.displayName}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
        />
        {state.errors?.email ? (
          <p className="text-sm text-rose-600">{state.errors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold tracking-[-0.01em] text-black"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="At least 8 characters"
          className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-base text-black outline-none transition-colors duration-200 placeholder:text-black/35 focus:border-black/30"
        />
        {state.errors?.password ? (
          <p className="text-sm text-rose-600">{state.errors.password}</p>
        ) : null}
      </div>

      {state.errors?.form ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.errors.form}
        </p>
      ) : null}

      <div className="space-y-3 pt-2">
        <SubmitButton mode={mode} pending={pending} disabled={!authConfigured} />
        <p className="text-center text-sm text-black/58">
          {mode === "signup"
            ? "Already have an account? "
            : "Need an account? "}
          <Link
            href={buildAuthHref(
              mode === "signup" ? "/login" : "/signup",
              redirectTo,
            )}
            className="font-semibold text-black"
          >
            {mode === "signup" ? "Log in" : "Sign up"}
          </Link>
        </p>
      </div>
    </form>
  );
}
