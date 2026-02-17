"use client";
import { useState, useEffect } from "react";
import type { ArticleFormData, ArticleStatus } from "@/lib/blog/articles";
import { generateSlug, isSlugAvailable } from "@/lib/blog/articles";
import { ImageUpload } from "./image-upload";

type ArticleFormProps = {
  initialData?: Partial<ArticleFormData>;
  onSubmit: (data: ArticleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  excludeArticleId?: string; // For slug availability check when editing
};

export function ArticleForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  excludeArticleId,
}: ArticleFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") || ""
  );
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(
    initialData?.featured_image_url || null
  );
  const [status, setStatus] = useState<ArticleStatus>(
    initialData?.status || "draft"
  );
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? true);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  // Auto-generate slug from title when title changes
  useEffect(() => {
    if (autoGenerateSlug && title) {
      const newSlug = generateSlug(title);
      setSlug(newSlug);
      setSlugError(null);
    }
  }, [title, autoGenerateSlug]);

  // Check slug availability when slug changes
  useEffect(() => {
    if (!slug) {
      setSlugError(null);
      return;
    }

    const checkSlug = async () => {
      setSlugChecking(true);
      const { available, error } = await isSlugAvailable(slug, excludeArticleId);

      if (error) {
        setSlugError("Error checking slug availability");
      } else if (!available) {
        setSlugError("This slug is already in use");
      } else {
        setSlugError(null);
      }
      setSlugChecking(false);
    };

    const timeoutId = setTimeout(checkSlug, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [slug, excludeArticleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!slug.trim()) {
      alert("Please enter a slug");
      return;
    }

    if (slugError) {
      alert("Please fix the slug error before submitting");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const formData: ArticleFormData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || undefined,
      category: category.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      featured_image_url: featuredImageUrl || undefined,
      status,
      is_public: isPublic,
      content: "", // Content is handled separately in the editor
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter article title"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Slug */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">
            Slug (URL) *
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={autoGenerateSlug}
              onChange={(e) => setAutoGenerateSlug(e.target.checked)}
              className="rounded"
            />
            Auto-generate from title
          </label>
        </div>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoGenerateSlug(false);
          }}
          placeholder="article-url-slug"
          required
          className={`w-full px-3 py-2 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 ${slugError
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 focus:ring-blue-500"
            }`}
        />
        {slugChecking && (
          <p className="mt-1 text-xs text-slate-500">Checking availability...</p>
        )}
        {slugError && (
          <p className="mt-1 text-sm text-red-600">{slugError}</p>
        )}
        {!slugError && slug && !slugChecking && (
          <p className="mt-1 text-xs text-slate-500">
            URL: /blog/{slug}
          </p>
        )}
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Excerpt (optional)
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of the article..."
          rows={3}
          maxLength={300}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          {excerpt.length}/300 characters
        </p>
      </div>

      {/* Category and Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category (optional)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Cardiology, Nutrition"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tags (optional)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Separate tags with commas
          </p>
        </div>
      </div>

      {/* Featured Image */}
      <ImageUpload
        value={featuredImageUrl}
        onChange={setFeaturedImageUrl}
        label="Featured Image"
      />

      {/* Status and Visibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArticleStatus)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Visibility
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700">
              Public (visible to everyone)
            </span>
          </label>
          {!isPublic && (
            <p className="mt-1 text-xs text-slate-500">
              Only authenticated users can view this article
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !!slugError}
        >
          {isSubmitting ? "Saving..." : "Save Article"}
        </button>
      </div>
    </form>
  );
}
