"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function Navbar() {
  const supabase = getSupabaseBrowserClient();
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Initial load
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

    // Validate session on mount and add recovery logic
    const checkAndRecoverSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Navbar] Session error:', error);
        await supabase.auth.signOut();
        setIdentifier(null);
        setRole(null);
        return;
      }

      if (session?.user) {
        setIdentifier(session.user.email ?? session.user.phone ?? null);
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setRole(prof?.role ?? null);
      }
    };

    checkAndRecoverSession();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Navbar] Auth event:', event);

      if (event === 'TOKEN_REFRESHED') {
        console.log('[Navbar] Token refreshed successfully');
      }

      if (session?.user) {
        setIdentifier(session.user.email ?? session.user.phone ?? null);
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setRole(prof?.role ?? null);
      } else {
        setIdentifier(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      globalThis.location.href = "/";
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#navbar-menu") && !target.closest("#hamburger-btn")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const navLinks = (
    <>
      <Link href="/doctors" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>Find Doctors</Link>
      <Link href="/diagnostics" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>Diagnostics</Link>
      <Link href="/blog" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>Blog</Link>
      {identifier ? (
        <>
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link href="/chat" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>Messages</Link>
          {role === "doctor" && (
            <Link href="/doctor/bookings" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>My Bookings</Link>
          )}
          {(role === "doctor" || role === "medical_professional") && (
            <Link href="/my/articles" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>My Articles</Link>
          )}
          {role === "patient" && (
            <Link href="/my/bookings" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>My Appointments</Link>
          )}
          {role === "admin" && (
            <Link href="/admin/roles" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>Admin</Link>
          )}
          <Link href="/my/profile" className="hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>Profile</Link>
          <button
            onClick={handleSignOut}
            className="hover:text-blue-600 transition-colors text-left"
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          href="/auth/sign-in"
          className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          Sign in
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/assets/novahdl_logo-removebg-preview.png"
            alt="NOVAHDL Solutions"
            width={240}
            height={80}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-700">
          {navLinks}
        </nav>

        {/* Hamburger button (mobile only) */}
        <button
          id="hamburger-btn"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <span
            className={`block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-gray-700 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          id="navbar-menu"
          className="md:hidden border-t bg-white px-4 py-4 flex flex-col gap-4 text-sm font-medium text-gray-700 shadow-md"
        >
          {navLinks}
        </div>
      )}
    </header>
  );
}
