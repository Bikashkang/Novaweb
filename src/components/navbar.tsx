"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/notification-bell";
import { useChatUnread } from "@/hooks/use-chat-unread";

export function Navbar() {
  const supabase = getSupabaseBrowserClient();
  const pathname = usePathname();
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount: chatUnread, clearUnread: clearChatUnread } = useChatUnread();

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auth state
  useEffect(() => {
    const loadSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
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
      } else {
        setIdentifier(null);
        setRole(null);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      window.location.href = "/";
    }
  };

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  // Close mobile menu on outside click
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `relative text-sm font-medium transition-colors duration-150 ${isActive(href)
      ? "text-blue-600"
      : "text-gray-600 hover:text-gray-900"
    }`;

  // Initials avatar from email
  const initials = identifier
    ? identifier.split("@")[0].slice(0, 2).toUpperCase()
    : "";

  const publicLinks = (
    <>
      <Link href="/doctors" className={linkClass("/doctors")} onClick={() => setMenuOpen(false)}>
        Find Doctors
      </Link>
      <Link href="/diagnostics" className={linkClass("/diagnostics")} onClick={() => setMenuOpen(false)}>
        Diagnostics
      </Link>
      <Link href="/blog" className={linkClass("/blog")} onClick={() => setMenuOpen(false)}>
        Blogs
      </Link>
    </>
  );

  const authLinks = (
    <>
      {role === "doctor" && (
        <Link href="/doctor/bookings" className={linkClass("/doctor/bookings")} onClick={() => setMenuOpen(false)}>
          My Bookings
        </Link>
      )}
      {(role === "doctor" || role === "medical_professional") && (
        <Link href="/my/articles" className={linkClass("/my/articles")} onClick={() => setMenuOpen(false)}>
          My Articles
        </Link>
      )}
      {role === "patient" && (
        <Link href="/my/bookings" className={linkClass("/my/bookings")} onClick={() => setMenuOpen(false)}>
          My Appointments
        </Link>
      )}
      {role === "admin" && (
        <Link href="/admin/roles" className={linkClass("/admin")} onClick={() => setMenuOpen(false)}>
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header
      className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b transition-shadow duration-200 ${scrolled ? "shadow-sm" : "shadow-none"
        }`}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/assets/novahdl_logo-removebg-preview.png"
            alt="NOVAHDL Solutions"
            width={240}
            height={80}
            className="h-11 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {publicLinks}
          {identifier && authLinks}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-1">
          {/* Chat icon — only when signed in */}
          {identifier && (
            <Link
              href="/chat"
              aria-label="Messages"
              onClick={clearChatUnread}
              className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-colors ${isActive("/chat") ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-600"
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {chatUnread > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
            </Link>
          )}
          <NotificationBell />
          {identifier ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1 hover:bg-gray-100 transition-colors"
                aria-label="User menu"
              >
                {/* Avatar circle */}
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                  {initials}
                </span>
                <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate">
                  {identifier.split("@")[0]}
                </span>
                {/* Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 truncate">{identifier}</p>
                    {role && <p className="text-xs font-medium text-blue-600 capitalize mt-0.5">{role.replace("_", " ")}</p>}
                  </div>
                  <Link
                    href="/my/profile"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/sign-in"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile right: bell + hamburger */}
        <div className="md:hidden flex items-center gap-1">
          <NotificationBell />
          <button
            id="hamburger-btn"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((p) => !p)}
            className="flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className={`block h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-700 rounded transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu — slide down */}
      <div
        id="navbar-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="border-t bg-white px-4 py-4 flex flex-col gap-1">
          {/* Public links */}
          <MobileLink href="/doctors" label="Find Doctors" active={isActive("/doctors")} />
          <MobileLink href="/diagnostics" label="Diagnostics" active={isActive("/diagnostics")} />
          <MobileLink href="/blog" label="Blog" active={isActive("/blog")} />

          {identifier ? (
            <>
              <div className="my-2 border-t border-gray-100" />
              <MobileLink href="/chat" label="Messages" active={isActive("/chat")} />
              {role === "doctor" && <MobileLink href="/doctor/bookings" label="My Bookings" active={isActive("/doctor/bookings")} />}
              {(role === "doctor" || role === "medical_professional") && <MobileLink href="/my/articles" label="My Articles" active={isActive("/my/articles")} />}
              {role === "patient" && <MobileLink href="/my/bookings" label="My Appointments" active={isActive("/my/bookings")} />}
              {role === "admin" && <MobileLink href="/admin/roles" label="Admin" active={isActive("/admin")} />}
              <MobileLink href="/my/profile" label="Profile" active={isActive("/my/profile")} />
              <div className="my-2 border-t border-gray-100" />
              {identifier && (
                <p className="text-xs text-gray-400 px-3 pb-1 truncate">{identifier}</p>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="my-2 border-t border-gray-100" />
              <Link
                href="/auth/sign-in"
                className="block text-center bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
        ? "bg-blue-50 text-blue-600"
        : "text-gray-700 hover:bg-gray-50"
        }`}
    >
      {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 shrink-0" />}
      {label}
    </Link>
  );
}
