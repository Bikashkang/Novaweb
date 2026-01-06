import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type Conversation = {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: number | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: "image" | "document" | null;
  attachment_name: string | null;
  created_at: string;
  read_at: string | null;
};

export type ConversationWithPartner = Conversation & {
  partner_name: string | null;
  partner_id: string;
  last_message: Message | null;
  unread_count: number;
};

/**
 * Find or create a conversation between a patient and doctor
 * @param patientId - Patient user ID
 * @param doctorId - Doctor user ID
 * @param appointmentId - Optional appointment ID to link the conversation
 * @returns Conversation object
 */
export async function findOrCreateConversation(
  patientId: string,
  doctorId: string,
  appointmentId?: number | null
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  // First, try to find existing conversation
  let query = supabase
    .from("conversations")
    .select("*")
    .eq("patient_id", patientId)
    .eq("doctor_id", doctorId);

  if (appointmentId) {
    query = query.eq("appointment_id", appointmentId);
  } else {
    query = query.is("appointment_id", null);
  }

  const { data: existing, error: findError } = await query.maybeSingle();

  if (findError && findError.code !== "PGRST116") {
    // PGRST116 is "not found" which is fine
    return { data: null, error: findError.message };
  }

  if (existing) {
    return { data: existing as Conversation, error: null };
  }

  // Create new conversation
  const { data: newConv, error: createError } = await supabase
    .from("conversations")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_id: appointmentId || null,
    })
    .select()
    .single();

  if (createError) {
    return { data: null, error: createError.message };
  }

  return { data: newConv as Conversation, error: null };
}

/**
 * Get all conversations for a user (as patient or doctor)
 * @param userId - User ID
 * @returns Array of conversations with partner info and last message
 */
export async function getConversationsForUser(
  userId: string
): Promise<{ data: ConversationWithPartner[] | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  // Get user's role to determine if they're patient or doctor
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const isDoctor = profile?.role === "doctor";

  // Fetch conversations
  const conversationsQuery = isDoctor
    ? supabase.from("conversations").select("*").eq("doctor_id", userId)
    : supabase.from("conversations").select("*").eq("patient_id", userId);

  const { data: conversations, error: convError } = await conversationsQuery.order("updated_at", {
    ascending: false,
  });

  if (convError) {
    return { data: null, error: convError.message };
  }

  if (!conversations || conversations.length === 0) {
    return { data: [], error: null };
  }

  // Enrich with partner info and last message
  const enriched: ConversationWithPartner[] = await Promise.all(
    conversations.map(async (conv) => {
      const partnerId = isDoctor ? conv.patient_id : conv.doctor_id;

      // Get partner profile
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", partnerId)
        .single();

      // Get last message
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMessage = messages && messages.length > 0 ? (messages[0] as Message) : null;

      // Count unread messages (messages not sent by user and not read)
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userId)
        .is("read_at", null);

      return {
        ...conv,
        partner_id: partnerId,
        partner_name: partnerProfile?.full_name || null,
        last_message: lastMessage,
        unread_count: count || 0,
      } as ConversationWithPartner;
    })
  );

  return { data: enriched, error: null };
}

/**
 * Get all messages for a conversation
 * @param conversationId - Conversation ID
 * @returns Array of messages
 */
export async function getConversationMessages(
  conversationId: string
): Promise<{ data: Message[] | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data || []) as Message[], error: null };
}

/**
 * Mark messages as read in a conversation
 * @param conversationId - Conversation ID
 * @param userId - Current user ID (recipient)
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Send a text message
 * @param conversationId - Conversation ID
 * @param senderId - Sender user ID
 * @param content - Message content
 */
export async function sendTextMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ data: Message | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Message, error: null };
}

/**
 * Send a message with attachment
 * @param conversationId - Conversation ID
 * @param senderId - Sender user ID
 * @param attachmentUrl - Attachment URL from storage
 * @param attachmentType - Attachment type
 * @param attachmentName - Original filename
 * @param content - Optional text content
 */
export async function sendAttachmentMessage(
  conversationId: string,
  senderId: string,
  attachmentUrl: string,
  attachmentType: "image" | "document",
  attachmentName: string,
  content?: string
): Promise<{ data: Message | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || null,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      attachment_name: attachmentName,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Message, error: null };
}



