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
      router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Create account</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="text-sm" htmlFor="name">Full Name *</label>
          <input 
            id="name" 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2 bg-white text-slate-900" 
            required 
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="email">Email *</label>
          <input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2 bg-white text-slate-900" 
            required 
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="password">Password *</label>
          <input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2 bg-white text-slate-900" 
            required 
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="phone">Phone Number (Optional)</label>
          <input 
            id="phone" 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border px-3 py-2 bg-white text-slate-900" 
            placeholder="+1 555 123 4567"
          />
          <p className="text-xs text-slate-500">Include country code if provided</p>
        </div>
        <button disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
          {loading ? "Creating..." : "Sign up"}
        </button>
        <div className="text-sm text-center space-y-1">
          <p>
            Have an account? <a href="/auth/sign-in" className="underline">Sign in</a>
          </p>
          <p>
            Prefer phone? <a href="/auth/phone-otp" className="underline">Use phone with SMS</a>
          </p>
        </div>
      </form>
    </main>
  );
}



