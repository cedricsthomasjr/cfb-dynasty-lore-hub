"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./password";
import { setSession, clearSession } from "./session";

export interface AuthState {
  error?: string;
}

function normalizeUsername(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/** Create an account (username + password), sign in, and go to the home menu. */
export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");

  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: await hashPassword(password),
        // email is still required/unique on User; synthesize a local one.
        email: `${username}@local`,
        name: username,
      },
    });
    userId = user.id;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "That username is already taken." };
    }
    throw err;
  }

  setSession(userId);
  redirect("/");
}

/** Verify credentials and start a session. */
export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { username } });
  // Same message whether the user is missing or the password is wrong.
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid username or password." };
  }

  setSession(user.id);
  redirect("/");
}

/** End the session and return to the login screen. */
export async function logout(): Promise<void> {
  clearSession();
  redirect("/login");
}
