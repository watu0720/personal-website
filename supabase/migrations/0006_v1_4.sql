-- v1.4 news posts, link previews

-- news_posts テーブル
create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body_html text not null,
  thumbnail_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_news_posts_status_updated
  on public.news_posts(status, updated_at desc);

create index if not exists idx_news_posts_tags
  on public.news_posts using gin (tags);

alter table public.news_posts enable row level security;

-- RLS policies for news_posts
-- public: published only
drop policy if exists news_posts_select_public on public.news_posts;
create policy news_posts_select_public
on public.news_posts
for select
to public
using (status='published' and deleted_at is null);

-- admin select all
drop policy if exists news_posts_select_admin on public.news_posts;
create policy news_posts_select_admin
on public.news_posts
for select
to authenticated
using (exists (select 1 from public.admin_roles ar where ar.user_id = auth.uid() and ar.role='admin'));

-- admin write
drop policy if exists news_posts_write_admin on public.news_posts;
create policy news_posts_write_admin
on public.news_posts
for all
to authenticated
using (exists (select 1 from public.admin_roles ar where ar.user_id = auth.uid() and ar.role='admin'))
with check (exists (select 1 from public.admin_roles ar where ar.user_id = auth.uid() and ar.role='admin'));

-- link_previews テーブル（リンクプレビューキャッシュ）
create table if not exists public.link_previews (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  provider text,
  title text,
  description text,
  image_url text,
  site_name text,
  fetched_at timestamptz not null default now(),
  ttl_seconds int not null default 86400,
  ok boolean not null default true,
  error_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_link_previews_url
  on public.link_previews(url);

alter table public.link_previews enable row level security;

-- public select OK（キャッシュは公開情報なので可）
drop policy if exists link_previews_select_public on public.link_previews;
create policy link_previews_select_public
on public.link_previews
for select
to public
using (true);

-- write: service role only（推奨：service role経由で書き込み）

-- commentsテーブルのpage_key外部キー制約を削除
-- news:<id>形式の動的ページキーに対応するため
alter table public.comments
  drop constraint if exists comments_page_key_fkey;

-- 注意: Storage bucket `news` は作成不要
-- お知らせの画像は `public-assets` バケット内の `news` フォルダに保存されます
