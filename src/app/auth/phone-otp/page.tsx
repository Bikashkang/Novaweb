"use client";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PhoneOtpPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"enter-phone" | "enter-otp">("enter-phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    (globalThis as any).onTurnstileToken = (token: string) => {
      setCaptchaToken(token);
    };
    function renderWidget() {
      const w = globalThis as any;
      if (w.turnstile && widgetRef.current) {
        w.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          theme: "auto",
          callback: (t: string) => (globalThis as any).onTurnstileToken(t)
        });
        return true;
      }
      return false;
    }
    if (renderWidget()) return;
    const scriptId = "turnstile-script";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = () => renderWidget();
      document.head.appendChild(s);
    }
  }, [siteKey]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
          captchaToken: captchaToken ?? undefined
        }
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo("We sent you an SMS with a code.");
        setStep("enter-otp");
      }
    } catch (err: any) {
      setError(err?.message ?? "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.replace("/");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Phone Auth</h1>
          <p className="text-slate-500 text-sm">Secure sign in via SMS verification</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm animate-shake">
            {error}
          </div>
        )}
        {info && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm">
            {info}
          </div>
        )}

        {step === "enter-phone" ? (
          <form onSubmit={requestOtp} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1" htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+91 99999 99999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
                required
              />
              <p className="text-[10px] text-slate-400 ml-1">Include country code, e.g. +91</p>
              {siteKey ? (
                <div className="pt-2 flex justify-center">
                  <div ref={widgetRef} className="scale-90" />
                </div>
              ) : (
                <p className="hidden">Optional: configure CAPTCHA</p>
              )}
            </div>
            <button
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 text-white py-4 font-semibold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
            <p className="text-sm text-center text-slate-500">
              Prefer email? <a href="/auth/sign-in" className="text-blue-600 font-semibold hover:underline decoration-2 underline-offset-4">Sign in</a>
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1" htmlFor="otp">Verification Code</label>
              <input
                id="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 bg-slate-50 text-slate-900 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                required
                autoFocus
              />
            </div>
            <button
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 text-white py-4 font-semibold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
            <button
              type="button"
              className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => {
                setStep("enter-phone");
                setOtp("");
                setInfo(null);
                setError(null);
              }}
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </main>
  );
}



