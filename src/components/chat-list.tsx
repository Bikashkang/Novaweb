"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getConversationsForUser, ConversationWithPartner } from "@/lib/chat/conversations";
import Link from "next/link";

export function ChatList() {
  const supabase = getSupabaseBrowserClient();
  const [conversations, setConversations] = useState<ConversationWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError("Not signed in");
        setLoading(false);
        return;
      }

      const { data, error: convError } = await getConversationsForUser(userId);
      if (!active) return;
      if (convError) {
        setError(convError);
        setLoading(false);
        return;
      }
      setConversations(data || []);
      setLoading(false);

      // Subscribe to new messages to update conversation list
      subscription = supabase
        .channel("conversations:updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          async () => {
            // Reload conversations when new message arrives
            const { data: updated } = await getConversationsForUser(userId);
            if (active && updated) {
              setConversations(updated);
            }
          }
        )
        .subscribe();
    }

    load();
    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">No conversations yet.</p>
      </div>
    );
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function getLastMessagePreview(message: ConversationWithPartner["last_message"]) {
    if (!message) return "No messages yet";
    if (message.attachment_url) {
      return message.attachment_type === "image" ? "📷 Image" : "📎 Document";
    }
    return message.content || "No content";
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/chat/${conv.id}`}
          className="block p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm text-slate-900 truncate">
                  {conv.partner_name || "Unknown User"}
                </h3>
                {conv.unread_count > 0 && (
                  <span className="flex-shrink-0 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                    {conv.unread_count}
                  </span>
                )}
                {conv.appointment_id && (
                  <span className="flex-shrink-0 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Appointment
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 truncate">
                {getLastMessagePreview(conv.last_message)}
              </p>
            </div>
            {conv.last_message && (
              <span className="flex-shrink-0 text-xs text-slate-500">
                {formatTime(conv.last_message.created_at)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}



