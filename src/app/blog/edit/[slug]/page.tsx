"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getArticleBySlug, updateArticle } from "@/lib/blog/articles";
import type { ArticleFormData, BlogArticle } from "@/lib/blog/articles";
import { ArticleForm } from "@/components/blog/article-form";
import { ArticleEditor } from "@/components/blog/article-editor";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = getSupabaseBrowserClient();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      // Check authentication
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;
      setCurrentUserId(userId);

      if (!userId) {
        router.replace("/auth/sign-in");
        return;
      }

      // Load article
      const { article: art, error: artError } = await getArticleBySlug(slug);

      if (!active) return;

      if (artError || !art) {
        setError(artError || "Article not found");
        setLoading(false);
        return;
      }

      // Check if user is author or admin
      const userIsAuthor = art.author_id === userId;
      setIsAuthor(userIsAuthor);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      const userIsAdmin = profile?.role === "admin";
      setIsAdmin(userIsAdmin);

      // Check permissions using the actual values, not state
      if (!userIsAuthor && !userIsAdmin) {
        setError("You don't have permission to edit this article");
        setLoading(false);
        return;
      }

      setArticle(art);
      setContent(art.content);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [slug, supabase, router]);

  const handleSubmit = async (formData: ArticleFormData) => {
    if (!article) {
      setError("Article not found");
      return;
    }

    if (!content.trim()) {
      setError("Please enter article content");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const articleData: Partial<ArticleFormData> = {
        ...formData,
        content: content.trim(),
      };

      const { article: updatedArticle, error: updateError } = await updateArticle(
        article.id,
        articleData
      );

      if (updateError || !updatedArticle) {
        setError(updateError || "Failed to update article");
        setIsSubmitting(false);
        return;
      }

      // Redirect to article detail page
      router.push(`/blog/${updatedArticle.slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to update article");
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

  if (error && !article) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Error</h1>
            <p className="text-red-800">{error}</p>
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

  if (!article) {
    return null;
  }

  const initialFormData: Partial<ArticleFormData> = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || undefined,
    category: article.category || undefined,
    tags: article.tags.length > 0 ? article.tags : undefined,
    featured_image_url: article.featured_image_url || undefined,
    status: article.status,
    is_public: article.is_public,
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Edit Article</h1>

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
              initialData={initialFormData}
              onSubmit={async (formData) => {
                if (!content.trim()) {
                  setError("Please enter article content");
                  return;
                }
                await handleSubmit({ ...formData, content: content.trim() });
              }}
              onCancel={() => router.back()}
              isSubmitting={isSubmitting}
              excludeArticleId={article.id}
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
