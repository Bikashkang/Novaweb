-- Blog articles table for doctors and medical professionals to write articles

create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null unique,
  content text not null,
  excerpt text,
  featured_image_url text,
  category text,
  tags text[] default '{}'::text[],
  status text not null default 'draft' check (status in ('draft', 'published', 'pending_review')),
  is_public boolean not null default true,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists blog_articles_author_id_idx on public.blog_articles(author_id);
create index if not exists blog_articles_status_idx on public.blog_articles(status);
create index if not exists blog_articles_slug_idx on public.blog_articles(slug);
create index if not exists blog_articles_category_idx on public.blog_articles(category);
create index if not exists blog_articles_published_at_idx on public.blog_articles(published_at desc);
create index if not exists blog_articles_status_published_at_idx on public.blog_articles(status, published_at desc) where status = 'published';

-- Enable RLS
alter table public.blog_articles enable row level security;

-- Helper function to check if user is doctor or medical professional
create or replace function public.is_doctor_or_medical_professional() returns boolean as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('doctor', 'medical_professional')
  );
$$ language sql stable security definer set search_path = public;

-- RLS Policies for blog_articles

-- Public read: Anyone can read published articles that are public
drop policy if exists "Public can read published public articles" on public.blog_articles;
create policy "Public can read published public articles" on public.blog_articles
  for select using (
    status = 'published' and is_public = true
  );

-- Authenticated read: Authenticated users can read any published article
drop policy if exists "Authenticated users can read published articles" on public.blog_articles;
create policy "Authenticated users can read published articles" on public.blog_articles
  for select using (
    auth.uid() is not null and status = 'published'
  );

-- Authors can read their own articles (all statuses)
drop policy if exists "Authors can read their own articles" on public.blog_articles;
create policy "Authors can read their own articles" on public.blog_articles
  for select using (author_id = auth.uid());

-- Admins can read all articles
drop policy if exists "Admins can read all articles" on public.blog_articles;
create policy "Admins can read all articles" on public.blog_articles
  for select using (public.is_admin());

-- Only doctors/medical professionals can create articles
drop policy if exists "Doctors and medical professionals can create articles" on public.blog_articles;
create policy "Doctors and medical professionals can create articles" on public.blog_articles
  for insert with check (
    public.is_doctor_or_medical_professional() and
    author_id = auth.uid()
  );

-- Authors can update their own articles
drop policy if exists "Authors can update their own articles" on public.blog_articles;
create policy "Authors can update their own articles" on public.blog_articles
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Admins can update any article
drop policy if exists "Admins can update any article" on public.blog_articles;
create policy "Admins can update any article" on public.blog_articles
  for update using (public.is_admin())
  with check (true);

-- Authors can delete their own articles
drop policy if exists "Authors can delete their own articles" on public.blog_articles;
create policy "Authors can delete their own articles" on public.blog_articles
  for delete using (author_id = auth.uid());

-- Admins can delete any article
drop policy if exists "Admins can delete any article" on public.blog_articles;
create policy "Admins can delete any article" on public.blog_articles
  for delete using (public.is_admin());

-- Function to update updated_at timestamp
create or replace function public.update_blog_articles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on article updates
drop trigger if exists trg_update_blog_articles_updated_at on public.blog_articles;
create trigger trg_update_blog_articles_updated_at
  before update on public.blog_articles
  for each row
  execute function public.update_blog_articles_updated_at();

-- Function to set published_at when status changes to published
create or replace function public.set_blog_article_published_at()
returns trigger as $$
begin
  if new.status = 'published' and old.status != 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  if new.status != 'published' then
    new.published_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to set published_at when publishing
drop trigger if exists trg_set_blog_article_published_at on public.blog_articles;
create trigger trg_set_blog_article_published_at
  before insert or update on public.blog_articles
  for each row
  execute function public.set_blog_article_published_at();

-- Comments for documentation
comment on table public.blog_articles is 'Blog articles written by doctors and medical professionals';
comment on column public.blog_articles.slug is 'URL-friendly unique identifier for the article';
comment on column public.blog_articles.status is 'Article status: draft, published, or pending_review';
comment on column public.blog_articles.is_public is 'If true, article is visible to public. If false, only authenticated users can view';
comment on column public.blog_articles.published_at is 'Timestamp when article was published (set automatically when status changes to published)';
