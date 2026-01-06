import { getSupabaseBrowserClient } from "./client";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB
const BUCKET_NAME = "chat-attachments";

export type AttachmentType = "image" | "document";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export function getFileType(file: File): AttachmentType | null {
  if (IMAGE_TYPES.includes(file.type)) {
    return "image";
  }
  if (DOCUMENT_TYPES.includes(file.type)) {
    return "document";
  }
  return null;
}

export function validateFileSize(file: File, type: AttachmentType): { valid: boolean; error?: string } {
  const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxMB}MB limit for ${type}s`,
    };
  }
  return { valid: true };
}

export async function uploadChatAttachment(
  file: File,
  conversationId: string,
  userId: string
): Promise<{ url: string; type: AttachmentType; name: string } | { error: string }> {
  const supabase = getSupabaseBrowserClient();

  // Determine file type
  const fileType = getFileType(file);
  if (!fileType) {
    return { error: "Unsupported file type. Please upload an image or document." };
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, fileType);
  if (!sizeValidation.valid) {
    return { error: sizeValidation.error || "File size validation failed" };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${conversationId}/${timestamp}-${randomStr}.${fileExt}`;

  // Upload file
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { error: `Upload failed: ${error.message}` };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    type: fileType,
    name: file.name,
  };
}



