"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError(null);

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Update the profile with name and phone
    // The profile should be created by the trigger, but we'll retry if needed
    if (authData.user) {
      let retries = 3;
      let profileError = null;

      while (retries > 0) {
        // Try to update the profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: name.trim(),
            phone: phone.trim() || null,
          })
          .eq("id", authData.user.id);

        if (!updateError) {
          profileError = null;
          break;
        }

        // If update fails, try to upsert (in case profile wasn't created yet)
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            full_name: name.trim(),
            phone: phone.trim() || null,
            role: "patient",
          });

        if (!upsertError) {
          profileError = null;
          break;
        }

        profileError = upsertError;
        retries--;

        // Wait a bit before retrying
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (profileError) {
        console.error("Error updating profile:", profileError);
        // Don't fail the sign-up if profile update fails, but log it
        // The user can update their profile later
      }
    }

    setLoading(false);
    router.replace("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 text-sm">Join the NOVAHDL healthcare community</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1" htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
                required
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1" htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1" htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
                required
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1" htmlFor="phone">Phone Number (Optional)</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
                placeholder="+1 555 123 4567"
              />
              <p className="text-[10px] text-slate-400 ml-1">Include country code if provided, e.g. +91</p>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 text-white py-4 font-semibold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="text-sm text-center space-y-4 pt-4">
          <p className="text-slate-500">
            Already have an account? <a href="/auth/sign-in" className="text-blue-600 font-semibold hover:underline decoration-2 underline-offset-4">Sign in</a>
          </p>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or continue with</span></div>
          </div>
          <p>
            <a href="/auth/phone-otp" className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              <span>📱</span> Phone & SMS
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}



