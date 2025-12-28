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
      router.replace("/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Phone verification</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {info && <p className="text-green-700 text-sm">{info}</p>}
        {step === "enter-phone" ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm" htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-white text-slate-900"
                required
              />
              <p className="text-xs text-muted-foreground">Include country code, e.g. +1.</p>
              {siteKey ? (
                <div className="pt-2">
                  <div ref={widgetRef} />
                </div>
              ) : (
                <p className="text-xs text-amber-700">Optional: configure CAPTCHA in Supabase and set NEXT_PUBLIC_TURNSTILE_SITE_KEY.</p>
              )}
            </div>
            <button disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
              {loading ? "Sending..." : "Send code"}
            </button>
            <p className="text-sm text-center">
              Prefer email? <a href="/auth/sign-in" className="underline">Sign in</a>
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm" htmlFor="otp">Enter code</label>
              <input
                id="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded border px-3 py-2 bg-white text-slate-900"
                required
              />
            </div>
            <button disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              className="w-full rounded border py-2"
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



