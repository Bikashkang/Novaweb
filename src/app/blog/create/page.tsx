"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createArticle } from "@/lib/blog/articles";
import type { ArticleFormData } from "@/lib/blog/articles";
import { ArticleForm } from "@/components/blog/article-form";
import { ArticleEditor } from "@/components/blog/article-editor";

export default function CreateArticlePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        router.replace("/auth/sign-in");
        return;
      }

      // Check if user is doctor or medical professional
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!active) return;

      if (
        profile?.role === "doctor" ||
        profile?.role === "medical_professional"
      ) {
        setAuthorized(true);
        setAuthorId(userId);
      } else {
        setError("Only doctors and medical professionals can create articles");
      }
      setLoading(false);
    }

    checkAuth();
    return () => {
      active = false;
    };
  }, [supabase, router]);

  const handleSubmit = async (formData: ArticleFormData) => {
    if (!authorId) {
      setError("Not authorized");
      return;
    }

    if (!content.trim()) {
      setError("Please enter article content");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const articleData: ArticleFormData = {
        ...formData,
        content: content.trim(),
      };

      const { article, error: createError } = await createArticle(
        authorId,
        articleData
      );

      if (createError || !article) {
        setError(createError || "Failed to create article");
        setIsSubmitting(false);
        return;
      }

      // Redirect to article detail page
      router.push(`/blog/${article.slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to create article");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!authorized || error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h1>
            <p className="text-red-800">
              {error || "Only doctors and medical professionals can create articles"}
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Create New Article</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Article Metadata Form */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Article Details
            </h2>
            <ArticleForm
              onSubmit={async (formData) => {
                if (!content.trim()) {
                  setError("Please enter article content");
                  return;
                }
                await handleSubmit({ ...formData, content: content.trim() });
              }}
              onCancel={() => router.back()}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Article Content *
            </h2>
            <ArticleEditor
              value={content}
              onChange={setContent}
              placeholder="Write your article content here..."
            />
            {!content.trim() && (
              <p className="mt-2 text-sm text-red-600">
                Article content is required
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
