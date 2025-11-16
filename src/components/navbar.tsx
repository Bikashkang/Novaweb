"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function Navbar() {
  const supabase = getSupabaseBrowserClient();
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (user) {
        setIdentifier(user.email ?? user.phone ?? null);
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(prof?.role ?? null);
      } else {
        setIdentifier(null);
        setRole(null);
      }
    });
  }, [supabase]);

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold">Novadoc</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/doctors" className="hover:underline">Find Doctors</Link>
          <Link href="/diagnostics" className="hover:underline">Diagnostics</Link>
          {identifier ? (
            <>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/chat" className="hover:underline">Messages</Link>
              {role === "doctor" && (
                <Link href="/doctor/bookings" className="hover:underline">My Bookings</Link>
              )}
              {role === "patient" && (
                <Link href="/my/bookings" className="hover:underline">My Appointments</Link>
              )}
              {role === "admin" && (
                <Link href="/admin/roles" className="hover:underline">Admin</Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  globalThis.location.href = "/";
                }}
                className="hover:underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/sign-in" className="hover:underline">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}


