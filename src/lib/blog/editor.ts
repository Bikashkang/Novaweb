import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: return as-is (DOMPurify requires DOM)
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "a",
      "img",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Generate a plain text excerpt from HTML content
 */
export function generateExcerpt(html: string, maxLength: number = 200): string {
  // Remove HTML tags and get plain text
  const text = html.replace(/<[^>]*>/g, "").trim();
  
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "...";
  }
  
  return truncated + "...";
}
