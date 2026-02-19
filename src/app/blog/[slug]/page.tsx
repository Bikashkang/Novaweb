"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getArticleBySlug } from "@/lib/blog/articles";
import { sanitizeHtml } from "@/lib/blog/editor";
import type { BlogArticleWithAuthor } from "@/lib/blog/articles";
import Link from "next/link";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = getSupabaseBrowserClient();
  const [article, setArticle] = useState<BlogArticleWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
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

      // Load article
      const { article: art, error: artError } = await getArticleBySlug(slug);

      if (!active) return;

      if (artError || !art) {
        setError(artError || "Article not found");
        setLoading(false);
        return;
      }

      // Check if article is accessible
      // Public articles are accessible to everyone
      // Non-public articles require authentication
      if (!art.is_public && !userId) {
        setError("This article requires authentication to view");
        setLoading(false);
        return;
      }

      // Check if user is author or admin
      if (userId) {
        setIsAuthor(art.author_id === userId);

        // Check if user is admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        setIsAdmin(profile?.role === "admin");
      }

      setArticle(art);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [slug, supabase]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  if (error || !article) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Error</h1>
            <p className="text-red-800">{error || "Article not found"}</p>
            <Link
              href="/blog"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sanitizedContent = sanitizeHtml(article.content);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          ← Back to Blog
        </Link>

        {/* Edit Button (for authors and admins) */}
        {(isAuthor || isAdmin) && (
          <div className="mb-4 flex justify-end">
            <Link
              href={`/blog/edit/${article.slug}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Edit Article
            </Link>
          </div>
        )}

        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="mb-8 w-full overflow-hidden rounded-lg bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="mx-auto max-h-[480px] w-full object-contain"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          {article.category && (
            <span className="inline-block mb-3 text-sm font-medium text-blue-600">
              {article.category}
            </span>
          )}
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-xl text-slate-600 mb-6">{article.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            {article.author_name && (
              <div>
                <span className="font-medium">By {article.author_name}</span>
                {article.author_speciality && (
                  <span className="ml-2">• {article.author_speciality}</span>
                )}
              </div>
            )}
            {article.published_at && (
              <span>{formatDate(article.published_at)}</span>
            )}
          </div>
          {article.tags && article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Article Content */}
        <article
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Styling for article content */}
        <style jsx global>{`
          .prose {
            color: #334155;
            line-height: 1.75;
          }
          .prose h1,
          .prose h2,
          .prose h3 {
            color: #0f172a;
            font-weight: 700;
            margin-top: 2em;
            margin-bottom: 1em;
          }
          .prose h1 {
            font-size: 2.25em;
          }
          .prose h2 {
            font-size: 1.875em;
          }
          .prose h3 {
            font-size: 1.5em;
          }
          .prose p {
            margin-top: 1.25em;
            margin-bottom: 1.25em;
          }
          .prose ul,
          .prose ol {
            margin-top: 1.25em;
            margin-bottom: 1.25em;
            padding-left: 1.625em;
          }
          .prose li {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
          .prose a {
            color: #2563eb;
            text-decoration: underline;
          }
          .prose a:hover {
            color: #1d4ed8;
          }
          .prose img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin-top: 2em;
            margin-bottom: 2em;
          }
          .prose strong {
            font-weight: 600;
            color: #0f172a;
          }
          .prose em {
            font-style: italic;
          }
        `}</style>
      </div>
    </main>
  );
}
