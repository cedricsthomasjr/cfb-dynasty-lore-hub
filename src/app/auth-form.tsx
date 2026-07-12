"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Trophy, AlertCircle } from "lucide-react";
import { login, signup, type AuthState } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/constants";

const INPUT_CLASS =
  "w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50";

const initial: AuthState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const [state, formAction] = useFormState<AuthState, FormData>(
    isLogin ? login : signup,
    initial
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-6 w-6" />
          </span>
          <h1 className="font-display text-xl font-bold tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to your dynasties."
              : "Create an account to start your dynasty."}
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-lg border bg-background p-6"
        >
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Username</span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              minLength={3}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
              className={INPUT_CLASS}
            />
            {!isLogin ? (
              <span className="text-xs text-muted-foreground">
                At least 8 characters.
              </span>
            ) : null}
          </label>

          {state.error ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton label={isLogin ? "Sign in" : "Create account"} />
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
