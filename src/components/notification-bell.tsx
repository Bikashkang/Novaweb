"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

type Notification = {
    id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    read: boolean;
    created_at: string;
};

const TYPE_ICONS: Record<string, string> = {
    appointment_booked: "📅",
    appointment_accepted: "✅",
    appointment_declined: "❌",
    appointment_cancelled: "🚫",
    prescription_created: "💊",
    video_call_ready: "🎥",
    appointment_reminder: "⏰",
};

const TYPE_COLORS: Record<string, string> = {
    appointment_accepted: "bg-green-50 border-green-100",
    appointment_declined: "bg-red-50 border-red-100",
    appointment_cancelled: "bg-orange-50 border-orange-100",
    prescription_created: "bg-purple-50 border-purple-100",
    video_call_ready: "bg-blue-50 border-blue-100",
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function getNotifLink(notif: Notification): string | null {
    const d = notif.data as Record<string, unknown>;
    if (notif.type === "prescription_created" && d.prescription_id) {
        return `/prescriptions/${d.prescription_id}`;
    }
    if (d.appointment_id) {
        return `/my/bookings`;
    }
    return null;
}

export function NotificationBell() {
    const supabase = getSupabaseBrowserClient();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Load notifications
    const loadNotifications = useCallback(async (uid: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", uid)
                .order("created_at", { ascending: false })
                .limit(30);

            if (error) {
                console.error("Error loading notifications:", error);
            } else if (data) {
                setNotifications(data as Notification[]);
            }
        } catch (err) {
            console.error("Exception loading notifications:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Get current user
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
                loadNotifications(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                loadNotifications(session.user.id);
            } else {
                setUserId(null);
                setNotifications([]);
            }
        });
        return () => subscription.unsubscribe();
    }, [supabase, loadNotifications]);

    // Realtime subscription for new notifications
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setNotifications((prev) => [payload.new as Notification, ...prev]);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setNotifications((prev) =>
                        prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Mark all as read when panel opens
    const handleOpen = async () => {
        setOpen((p) => !p);
        if (!open && unreadCount > 0 && userId) {
            // Optimistic update
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", userId)
                .eq("read", false);
        }
    };

    const markOneRead = async (id: string) => {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
        await supabase.from("notifications").update({ read: true }).eq("id", id);
    };

    const clearAll = async () => {
        if (!userId) return;
        setNotifications([]);
        await supabase.from("notifications").delete().eq("user_id", userId);
    };

    // Don't render if not signed in
    if (!userId) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={handleOpen}
                aria-label="Notifications"
                className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
            >
                <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                                <span className="text-3xl">🔔</span>
                                <p className="text-sm font-medium text-gray-700">All caught up!</p>
                                <p className="text-xs text-gray-400">You&apos;ll see appointment updates and other alerts here.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const icon = TYPE_ICONS[notif.type] ?? "🔔";
                                const colorClass = TYPE_COLORS[notif.type] ?? "bg-gray-50 border-gray-100";
                                const link = getNotifLink(notif);
                                const content = (
                                    <div
                                        className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${!notif.read ? "bg-blue-50/40" : ""}`}
                                        onClick={() => markOneRead(notif.id)}
                                    >
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${colorClass}`}>
                                            {icon}
                                        </div>
                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-1">
                                                <p className={`text-sm font-medium leading-tight ${!notif.read ? "text-gray-900" : "text-gray-700"}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.read && (
                                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                                            <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                                        </div>
                                    </div>
                                );

                                return link ? (
                                    <Link key={notif.id} href={link} onClick={() => setOpen(false)}>
                                        {content}
                                    </Link>
                                ) : (
                                    <div key={notif.id}>{content}</div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-2.5">
                            <Link
                                href="/my/bookings"
                                className="text-xs text-blue-600 hover:underline font-medium"
                                onClick={() => setOpen(false)}
                            >
                                View all appointments →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
