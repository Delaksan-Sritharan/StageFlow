"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login, signUp, type AuthFormState } from "@/app/auth/actions";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

const initialState: AuthFormState = {
  errors: {},
};

function SubmitButton({ mode }: { mode: AuthMode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
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

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "signup" ? signUp : login;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
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
        <SubmitButton mode={mode} />
        <p className="text-center text-sm text-black/58">
          {mode === "signup"
            ? "Already have an account? "
            : "Need an account? "}
          <Link
            href={mode === "signup" ? "/login" : "/signup"}
            className="font-semibold text-black"
          >
            {mode === "signup" ? "Log in" : "Sign up"}
          </Link>
        </p>
      </div>
    </form>
  );
}
