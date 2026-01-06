"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import Link from "next/link";

export default function ConversationPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        router.replace("/auth/sign-in");
        return;
      }

      if (!active) return;
      setCurrentUserId(userId);

      // Fetch conversation to get partner info
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("patient_id, doctor_id")
        .eq("id", conversationId)
        .single();

      if (!active) return;
      if (convError) {
        setError(convError.message);
        setLoading(false);
        return;
      }

      // Determine partner ID
      const partnerId = userId === conv.patient_id ? conv.doctor_id : conv.patient_id;

      // Get partner profile
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", partnerId)
        .single();

      if (!active) return;
      setPartnerName(partnerProfile?.full_name || null);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [conversationId, supabase, router]);

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <p>Loading conversation...</p>
      </main>
    );
  }

  if (error || !currentUserId) {
    return (
      <main className="container mx-auto p-6">
        <p className="text-red-600">{error || "Failed to load conversation"}</p>
        <Link href="/chat" className="text-blue-600 underline mt-2 inline-block">
          Back to Messages
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/chat" className="text-blue-600 hover:underline">
            ← Back to Messages
          </Link>
          <h1 className="text-2xl font-semibold">
            {partnerName || "Conversation"}
          </h1>
        </div>
        <div className="bg-white rounded-lg border shadow-sm h-[600px] flex flex-col">
          <ChatInterface
            conversationId={conversationId}
            currentUserId={currentUserId}
            partnerName={partnerName}
          />
        </div>
      </div>
    </main>
  );
}



