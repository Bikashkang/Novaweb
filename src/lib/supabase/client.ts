import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

const noOpLock = async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
  return await fn();
};

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
