"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getArticlesByAuthor, deleteArticle } from "@/lib/blog/articles";
import type { BlogArticle } from "@/lib/blog/articles";
import Link from "next/link";

export default function MyArticlesPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

        // Load articles
        const { articles: arts, error: artsError } = await getArticlesByAuthor(
          userId
        );

        if (!active) return;

        if (artsError) {
          setError(artsError);
        } else {
          setArticles(arts);
        }
      } else {
        setError("Only doctors and medical professionals can manage articles");
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [supabase, router]);

  const handleDelete = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }

    setDeletingId(articleId);
    const { error: deleteError } = await deleteArticle(articleId);

    if (deleteError) {
      alert(`Failed to delete article: ${deleteError}`);
      setDeletingId(null);
      return;
    }

    // Remove from list
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    setDeletingId(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-slate-100 text-slate-700",
      published: "bg-green-100 text-green-700",
      pending_review: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span
        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft
          }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h1>
            <p className="text-red-800">
              {error || "Only doctors and medical professionals can manage articles"}
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">My Articles</h1>
          <Link
            href="/blog/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create New Article
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-slate-600 mb-4">You haven&apos;t created any articles yet.</p>
            <Link
              href="/blog/create"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Article
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {article.title}
                        </div>
                        {article.excerpt && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {article.excerpt}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(article.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {article.category || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(article.published_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(article.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {article.status === "published" && (
                            <Link
                              href={`/blog/${article.slug}`}
                              className="text-blue-600 hover:text-blue-900"
                              target="_blank"
                            >
                              View
                            </Link>
                          )}
                          <Link
                            href={`/blog/edit/${article.slug}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(article.id)}
                            disabled={deletingId === article.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === article.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
