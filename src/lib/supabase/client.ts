import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

// Use a no-op lock to bypass the browser's Web Locks API.
// The Navigator LockManager can deadlock on rapid page reloads when a previous
// page's exclusive lock on the auth token hasn't been released yet.
// Since we now use onAuthStateChange as the single source of truth (no concurrent
// getSession() calls), we no longer need the lock for serialization.
const noOpLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: noOpLock,
      },
    }
  );

  return client;
}
