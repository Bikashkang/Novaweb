import { getSupabaseBrowserClient } from "./client";
import { reliableAuth, ensureSession } from "./reliable-client";

import type { User } from "@supabase/supabase-js";

/**
 * Get current user with retry logic
 */
export async function getCurrentUser() {
  return reliableAuth<{ user: User | null }>(async (supabase) => {
    return await supabase.auth.getUser() as any;
  });
}

/**
 * Sign in with email and password (with retry)
 */
export async function signInWithPassword(email: string, password: string) {
  return reliableAuth(
    async (supabase) => {
      return await supabase.auth.signInWithPassword({ email, password }) as any;
    },
    {
      maxRetries: 2, // Don't retry too many times for auth failures
      retryDelay: 500,
    }
  );
}

/**
 * Sign in with OTP (with retry)
 */
export async function signInWithOtp(phone: string, options?: { shouldCreateUser?: boolean; captchaToken?: string }) {
  return reliableAuth(
    async (supabase) => {
      return await supabase.auth.signInWithOtp({
        phone,
        options: options || {},
      }) as any;
    },
    {
      maxRetries: 2,
      retryDelay: 500,
    }
  );
}

/**
 * Verify OTP (with retry)
 */
export async function verifyOtp(phone: string, token: string, type: "sms" = "sms") {
  return reliableAuth(
    async (supabase) => {
      return await supabase.auth.verifyOtp({ phone, token, type }) as any;
    },
    {
      maxRetries: 2,
      retryDelay: 500,
    }
  );
}

/**
 * Sign out (with retry)
 */
export async function signOut() {
  return reliableAuth(
    async (supabase) => {
      return await supabase.auth.signOut() as any;
    },
    {
      maxRetries: 2,
      retryDelay: 500,
    }
  );
}

/**
 * Wait for auth state to be ready
 */
export async function waitForAuthReady(maxWait = 5000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const { data, error } = await getCurrentUser();
    if (!error || error.message?.includes("not authenticated")) {
      return true; // Auth is ready (either authenticated or not)
    }

    // If it's a network error, wait and retry
    if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
      await new Promise(resolve => setTimeout(resolve, 200));
      continue;
    }

    // Other errors mean auth is ready but failed
    return true;
  }

  return false; // Timeout
}
