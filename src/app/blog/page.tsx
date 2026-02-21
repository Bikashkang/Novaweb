"use client";
import { useState, useEffect } from "react";
import { getPublishedArticles, getCategories } from "@/lib/blog/articles";
import type { BlogArticleWithAuthor } from "@/lib/blog/articles";
import { ArticleCard } from "@/components/blog/article-card";
import { useQuery } from "@tanstack/react-query";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["blog_categories"],
    queryFn: async () => {
      const { categories, error } = await getCategories();
      if (error) throw new Error(error);
      return categories || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: articlesData, isLoading: articlesLoading, error: articlesError } = useQuery({
    queryKey: ["blog_articles", selectedCategory],
    queryFn: async () => {
      const { articles, error } = await getPublishedArticles({
        category: selectedCategory || undefined,
        limit: 50,
      });
      if (error) throw new Error(error);
      return articles || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData || [];
  const articles = articlesData || [];
  const loading = categoriesLoading || articlesLoading;
  const error = articlesError ? articlesError.message : null;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Blog</h1>
          <p className="text-slate-600">
            Articles and insights from our medical professionals
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error loading articles: {error}</p>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && (
          <>
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">
                  {selectedCategory
                    ? `No articles found in "${selectedCategory}" category.`
                    : "No articles published yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
