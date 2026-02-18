"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useChatUnread() {
    const supabase = getSupabaseBrowserClient();
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);

    // Simpler approach: fetch conversations first, then count unread messages
    const fetchUnreadSimple = useCallback(async (uid: string) => {
        // Step 1: get all conversation IDs for this user
        const { data: convos, error: convErr } = await supabase
            .from("conversations")
            .select("id")
            .or(`patient_id.eq.${uid},doctor_id.eq.${uid}`);

        if (convErr || !convos || convos.length === 0) {
            setUnreadCount(0);
            return;
        }

        const convoIds = convos.map((c) => c.id);

        // Step 2: count unread messages in those conversations
        const { count, error } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .in("conversation_id", convoIds)
            .is("read_at", null)
            .neq("sender_id", uid);

        if (!error && count !== null) {
            setUnreadCount(count);
        }
    }, [supabase]);

    // Auth state
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
                fetchUnreadSimple(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                fetchUnreadSimple(session.user.id);
            } else {
                setUserId(null);
                setUnreadCount(0);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, fetchUnreadSimple]);

    // Realtime: listen for new messages and read_at updates
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`chat-unread:${userId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                () => {
                    // Refetch on any new message (could be for us)
                    fetchUnreadSimple(userId);
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "messages" },
                () => {
                    // Refetch when messages are marked as read
                    fetchUnreadSimple(userId);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId, supabase, fetchUnreadSimple]);

    // Clear badge when user navigates to /chat (mark all as read)
    const clearUnread = useCallback(() => {
        setUnreadCount(0);
    }, []);

    return { unreadCount, clearUnread };
}
