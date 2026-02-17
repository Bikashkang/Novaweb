"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const user = data.user;
      if (!user) {
        router.replace("/auth/sign-in");
      } else {
        setEmail(user.email ?? user.phone ?? null);
        // read role from profiles
        fetchRole(user.id);
      }
    });
    async function fetchRole(userId: string) {
      const supa = getSupabaseBrowserClient();
      const { data } = await supa.from("profiles").select("role").eq("id", userId).single();
      setRole(data?.role ?? null);
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-slate-600">Signed in as {email} {role ? `• ${role}` : ""}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/doctors" className="rounded border p-4 hover:bg-slate-50">
          Find Doctors and Book Appointments
        </a>
        <a href="/chat" className="rounded border p-4 hover:bg-slate-50">
          Messages
        </a>
        {role === "doctor" && (
          <a href="/doctor/bookings" className="rounded border p-4 hover:bg-slate-50">
            View My Bookings
          </a>
        )}
        {role === "patient" && (
          <a href="/my/bookings" className="rounded border p-4 hover:bg-slate-50">
            View My Appointments
          </a>
        )}
        {role === "admin" && (
          <a href="/admin/roles" className="rounded border p-4 hover:bg-slate-50">
            Manage Roles
          </a>
        )}
        <a href="/diagnostics" className="rounded border p-4 hover:bg-slate-50">
          Book Diagnostic Tests
        </a>
        <a href="/my/profile" className="rounded border p-4 hover:bg-slate-50">
          View My Profile
        </a>
      </div>
    </main>
  );
}



