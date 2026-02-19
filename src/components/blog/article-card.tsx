import Link from "next/link";
import type { BlogArticleWithAuthor } from "@/lib/blog/articles";

type ArticleCardProps = {
  article: BlogArticleWithAuthor;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="block rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      {article.featured_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-slate-50">
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="h-full w-full object-contain"
          />
        </div>
      )}
      <div className="p-6">
        {article.category && (
          <span className="inline-block mb-2 text-xs font-medium text-blue-600">
            {article.category}
          </span>
        )}
        <h2 className="mb-2 text-xl font-semibold text-slate-900 line-clamp-2">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="mb-4 text-sm text-slate-600 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            {article.author_name && (
              <span>By {article.author_name}</span>
            )}
            {article.author_speciality && (
              <span className="ml-2">• {article.author_speciality}</span>
            )}
          </div>
          {article.published_at && (
            <span>{formatDate(article.published_at)}</span>
          )}
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
