"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChatList } from "@/components/chat-list";

export default function ChatPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth/sign-in");
      } else {
        setAuthenticated(true);
        setLoading(false);
      }
    });
  }, [supabase, router]);

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <main className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Messages</h1>
        <div className="bg-white rounded-lg border shadow-sm min-h-[600px]">
          <ChatList />
        </div>
      </div>
    </main>
  );
}



