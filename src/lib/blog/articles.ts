import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ArticleStatus = "draft" | "published" | "pending_review";

export type BlogArticle = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  tags: string[];
  status: ArticleStatus;
  is_public: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogArticleWithAuthor = BlogArticle & {
  author_name: string | null;
  author_speciality: string | null;
};

export type ArticleFormData = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string | null;
  category?: string | null;
  tags?: string[];
  status: ArticleStatus;
  is_public: boolean;
};

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Create a new blog article
 */
export async function createArticle(
  authorId: string,
  data: ArticleFormData
): Promise<{ article: BlogArticle | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: article, error } = await supabase
    .from("blog_articles")
    .insert({
      author_id: authorId,
      title: data.title.trim(),
      slug: data.slug.trim(),
      content: data.content,
      excerpt: data.excerpt?.trim() || null,
      featured_image_url: data.featured_image_url || null,
      category: data.category?.trim() || null,
      tags: data.tags || [],
      status: data.status,
      is_public: data.is_public,
    })
    .select()
    .single();

  if (error) {
    return { article: null, error: error.message };
  }

  return { article: article as BlogArticle, error: null };
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(
  slug: string
): Promise<{ article: BlogArticleWithAuthor | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: article, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return { article: null, error: error.message };
  }

  // Fetch author profile separately
  let authorName: string | null = null;
  let authorSpeciality: string | null = null;

  if (article) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, speciality")
      .eq("id", article.author_id)
      .single();

    if (profile) {
      authorName = profile.full_name || null;
      authorSpeciality = profile.speciality || null;
    }
  }

  const articleWithAuthor: BlogArticleWithAuthor = {
    ...(article as BlogArticle),
    author_name: authorName,
    author_speciality: authorSpeciality,
  };

  return { article: articleWithAuthor, error: null };
}

/**
 * Get article by ID
 */
export async function getArticleById(
  id: string
): Promise<{ article: BlogArticle | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: article, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { article: null, error: error.message };
  }

  return { article: article as BlogArticle, error: null };
}

/**
 * Get all published articles (for public listing)
 */
export async function getPublishedArticles(
  options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ articles: BlogArticleWithAuthor[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from("blog_articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  // Fetch articles first
  console.log("getPublishedArticles: Executing blog_articles query...");
  const { data: articles, error } = await query;
  console.log("getPublishedArticles: blog_articles query result count:", articles?.length, "Error:", error);

  if (error) {
    return { articles: [], error: error.message };
  }

  if (!articles || articles.length === 0) {
    return { articles: [], error: null };
  }

  // Get unique author IDs
  const authorIds = [...new Set(articles.map((a: BlogArticle) => a.author_id))];
  console.log("getPublishedArticles: Found author IDs:", authorIds);

  // Fetch all author profiles in a single query (fixes N+1 problem)
  // If this fails due to RLS, articles will still be returned without author info
  let profileMap = new Map();
  if (authorIds.length > 0) {
    try {
      console.log("getPublishedArticles: Fetching author profiles...");
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, speciality")
        .in("id", authorIds);
      console.log("getPublishedArticles: Author profiles fetched. Count:", profiles?.length, "Error:", profileError);

      if (!profileError && profiles) {
        profileMap = new Map(
          profiles.map((p) => [p.id, { full_name: p.full_name, speciality: p.speciality }])
        );
      } else if (profileError) {
        console.warn("Could not load author profiles:", profileError);
      }
    } catch (err) {
      console.warn("Exception loading author profiles:", err);
    }
  }

  // Map articles with author info
  const articlesWithAuthor: BlogArticleWithAuthor[] = articles.map((article: BlogArticle) => {
    const profile = profileMap.get(article.author_id);
    return {
      ...article,
      author_name: profile?.full_name || null,
      author_speciality: profile?.speciality || null,
    };
  });

  console.log("getPublishedArticles: Successfully mapped all articles and authors.");
  return { articles: articlesWithAuthor, error: null };
}

/**
 * Get all articles by author
 */
export async function getArticlesByAuthor(
  authorId: string
): Promise<{ articles: BlogArticle[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: articles, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    return { articles: [], error: error.message };
  }

  return { articles: (articles as BlogArticle[]) || [], error: null };
}

/**
 * Get all categories from published articles
 */
export async function getCategories(): Promise<{ categories: string[]; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { data: articles, error } = await supabase
    .from("blog_articles")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);

  if (error) {
    return { categories: [], error: error.message };
  }

  const categories = Array.from(
    new Set((articles || []).map((a: any) => a.category).filter(Boolean))
  ) as string[];

  return { categories, error: null };
}

/**
 * Update an existing article
 */
export async function updateArticle(
  id: string,
  data: Partial<ArticleFormData>
): Promise<{ article: BlogArticle | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.slug !== undefined) updateData.slug = data.slug.trim();
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt?.trim() || null;
  if (data.featured_image_url !== undefined) updateData.featured_image_url = data.featured_image_url || null;
  if (data.category !== undefined) updateData.category = data.category?.trim() || null;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.is_public !== undefined) updateData.is_public = data.is_public;

  const { data: article, error } = await supabase
    .from("blog_articles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { article: null, error: error.message };
  }

  return { article: article as BlogArticle, error: null };
}

/**
 * Delete an article
 */
export async function deleteArticle(
  id: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("blog_articles")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Check if slug is available (not already used by another article)
 */
export async function isSlugAvailable(
  slug: string,
  excludeArticleId?: string
): Promise<{ available: boolean; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from("blog_articles")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (excludeArticleId) {
    query = query.neq("id", excludeArticleId);
  }

  const { data, error } = await query;

  if (error) {
    return { available: false, error: error.message };
  }

  return { available: !data || data.length === 0, error: null };
}
