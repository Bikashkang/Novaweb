import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) {
      console.log(`[CookieStorage] GET ${key}: FOUND`);
      return decodeURIComponent(match[2]);
    }
    console.log(`[CookieStorage] GET ${key}: NOT FOUND`);
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    console.log(`[CookieStorage] SET ${key}`);
    // Set cookie with 1 year expiry and path /
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax; Secure`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    console.log(`[CookieStorage] REMOVE ${key}`);
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
  }
};

// Custom lock implementation to bypass Navigator.locks timeout issues
// Based on GoTrueClient implementation, lock should be a function
const noOpLock = async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
  // console.log(`[NoOpLock] Bypassing lock for ${name}`); 
  return await fn();
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
      storage: cookieStorage,
      lock: noOpLock, // Bypass Navigator.locks
      debug: true
    }
  });

  if (typeof window !== "undefined") {
    (window as any).__supabaseClient = client;
    browserClient = client;
    console.log("[SupabaseClient] Created GLOBAL browser client instance with CUSTOM STORAGE and NO-OP LOCK");
  } else {
    browserClient = client;
    console.log("[SupabaseClient] Created SERVER-SIDE browser client instance");
  }

  return client;
}
