"use client";
import { useState } from "react";
import { generateShareLink } from "@/lib/prescriptions/prescriptions";

type PrescriptionShareButtonProps = {
  prescriptionId: string;
};

export function PrescriptionShareButton({ prescriptionId }: PrescriptionShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const { url, error: shareError } = await generateShareLink(prescriptionId);

      if (shareError || !url) {
        setError(shareError || "Failed to generate share link");
        setLoading(false);
        return;
      }

      setShareUrl(url);

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (clipboardError) {
        // Fallback: select text for manual copy
        setError("Failed to copy to clipboard. Please copy the link manually.");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Share error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>Share</span>
          </>
        )}
      </button>

      {(shareUrl || error) && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10">
          {error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">
                {copied ? "Link copied to clipboard!" : "Share this link:"}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl || ""}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    if (shareUrl) {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                      } catch (err) {
                        setError("Failed to copy");
                      }
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Anyone with this link can view the prescription (must be signed in)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

