"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { attemptLogin } from "@/server/auth/loginFlow";
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from "@/server/auth/session";

export interface LoginState {
  error?: string;
}

/**
 * The one admin login path — a Server Action (Next.js's own recommended
 * pattern, docs — Authentication guide, "Sign-up and login functionality"),
 * not a client-side fetch: the password never touches client JS, and
 * the form works even before hydration. The actual decision (env
 * configured? rate limited? password correct?) lives in
 * src/server/auth/loginFlow.ts's attemptLogin() — a plain, unit-tested
 * function; this wrapper only does the Next-specific I/O
 * (`headers()`/`cookies()`/`redirect()`) that can't run outside a real
 * request, so isn't itself unit-tested (docs/COMMAND_CENTER.md, "Why
 * loginAction itself has no direct test").
 */
export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const result = attemptLogin(formData.get("password"), ip);

  if (!result.ok) {
    return { error: result.error };
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, result.token, adminSessionCookieOptions());

  redirect("/admin");
}
