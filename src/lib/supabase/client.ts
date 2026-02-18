import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

// CRITICAL: Storage must handle values as-is since Supabase does JSON stringify/parse internally
const properCookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) {
      return decodeURIComponent(match[2]);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
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
      detectSessionInUrl: false, // Disable to prevent hanging on pages without auth codes in URL
      storage: properCookieStorage,
      lock: noOpLock,
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
