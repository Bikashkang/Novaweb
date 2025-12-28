"use client";
import { useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getConversationMessages,
  sendTextMessage,
  sendAttachmentMessage,
  markMessagesAsRead,
  Message,
} from "@/lib/chat/conversations";
import { uploadChatAttachment } from "@/lib/supabase/storage";
import Image from "next/image";

type ChatInterfaceProps = {
  conversationId: string;
  currentUserId: string;
  partnerName: string | null;
};

export function ChatInterface({ conversationId, currentUserId, partnerName }: ChatInterfaceProps) {
  const supabase = getSupabaseBrowserClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: msgError } = await getConversationMessages(conversationId);
      if (!active) return;
      if (msgError) {
        setError(msgError);
        setLoading(false);
        return;
      }
      setMessages(data || []);
      setLoading(false);

      // Mark messages as read
      await markMessagesAsRead(conversationId, currentUserId);

      // Subscribe to new messages
      subscription = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload: any) => {
            const newMessage = payload.new as Message;
            if (active) {
              // Only add if message doesn't already exist (avoid duplicates)
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
              });
              // Mark as read if it's not from current user
              if (newMessage.sender_id !== currentUserId) {
                await markMessagesAsRead(conversationId, currentUserId);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            const updatedMessage = payload.new as Message;
            if (active) {
              // Update existing message (e.g., read receipts)
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
              );
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
  }, [conversationId, currentUserId, supabase]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!messageText.trim() && !uploading) return;

    const text = messageText.trim();
    const tempId = Date.now(); // Temporary ID for optimistic update
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text,
      attachment_url: null,
      attachment_type: null,
      attachment_name: null,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    // Optimistically add message immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText("");

    // Send message to server
    const { data, error } = await sendTextMessage(conversationId, currentUserId, text);
    if (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(error);
      alert(`Failed to send message: ${error}`);
      setMessageText(text); // Restore text
    } else if (data) {
      // Replace optimistic message with real one from server
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadChatAttachment(file, conversationId, currentUserId);
      if ("error" in result) {
        setError(result.error);
        alert(result.error);
        setUploading(false);
        return;
      }

      const textContent = messageText.trim() || undefined;
      const tempId = Date.now(); // Temporary ID for optimistic update
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: textContent || null,
        attachment_url: result.url,
        attachment_type: result.type,
        attachment_name: result.name,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      // Optimistically add message immediately
      setMessages((prev) => [...prev, optimisticMessage]);
      const textToRestore = messageText.trim();
      setMessageText("");

      const { data, error } = await sendAttachmentMessage(
        conversationId,
        currentUserId,
        result.url,
        result.type,
        result.name,
        textContent
      );

      if (error) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(error);
        alert(`Failed to send attachment: ${error}`);
        setMessageText(textToRestore); // Restore text
      } else if (data) {
        // Replace optimistic message with real one from server
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function formatMessageTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwn ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {msg.attachment_url && (
                    <div className="mb-2">
                      {msg.attachment_type === "image" ? (
                        <div className="relative w-full max-w-sm rounded overflow-hidden">
                          <Image
                            src={msg.attachment_url}
                            alt={msg.attachment_name || "Image"}
                            width={400}
                            height={300}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`underline ${isOwn ? "text-blue-100" : "text-blue-600"}`}
                        >
                          📎 {msg.attachment_name || "Document"}
                        </a>
                      )}
                    </div>
                  )}
                  {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {formatMessageTime(msg.created_at)}
                    {msg.read_at && isOwn && " ✓✓"}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 rounded border hover:bg-slate-50 disabled:opacity-50"
            title="Attach file"
          >
            {uploading ? "Uploading..." : "📎"}
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded border px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          />
          <button
            onClick={handleSend}
            disabled={uploading || !messageText.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

