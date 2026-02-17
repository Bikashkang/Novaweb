import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

// CRITICAL: Storage must handle values as-is since Supabase does JSON stringify/parse internally
const properCookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) {
      const value = decodeURIComponent(match[2]);
      console.log(`[CookieStorage] GET ${key}: FOUND`);
      return value; // Already JSON string from Supabase
    }
    console.log(`[CookieStorage] GET ${key}: NOT FOUND`);
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    console.log(`[CookieStorage] SET ${key}`);
    // value is already JSON-stringified by Supabase
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax; Secure`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    console.log(`[CookieStorage] REMOVE ${key}`);
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
  }
};

// CRITICAL: No-op lock to bypass browser lock API entirely
const noOpLock = async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
  return await fn(); // No locking, just execute immediately
};

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    // Client-side: use global singleton to prevent multiple instances
    if ((window as any).__supabaseClient) {
      return (window as any).__supabaseClient;
    }
  }

  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing Supabase env vars NEXT_PUBLIC_SUPABASE_URL/ANON_KEY");
  }

  const client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: properCookieStorage,
      lock: noOpLock,
      flowType: 'pkce', // Use PKCE flow for better security
    }
  });

  if (typeof window !== "undefined") {
    (window as any).__supabaseClient = client;
    browserClient = client;
    console.log("[SupabaseClient] Created GLOBAL client with proper cookie storage + no-op lock");
  } else {
    browserClient = client;
    console.log("[SupabaseClient] Created SERVER-SIDE browser client instance");
  }

  return client;
}
