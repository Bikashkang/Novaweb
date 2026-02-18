"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Hard redirect so middleware can read fresh auth cookies and stale JS chunks are cleared
      window.location.href = "/";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="text-sm" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2 bg-white text-slate-900" required />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2 bg-white text-slate-900" required />
        </div>
        <button disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="text-sm text-center space-y-1">
          <p>
            No account? <a href="/auth/sign-up" className="underline">Sign up</a>
          </p>
          <p>
            Prefer phone? <a href="/auth/phone-otp" className="underline">Sign in with SMS</a>
          </p>
        </div>
      </form>
    </main>
  );
}



