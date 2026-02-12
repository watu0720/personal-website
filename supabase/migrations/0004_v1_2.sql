-- v1.2 search improvements: pg_trgm + GIN indexes

create extension if not exists pg_trgm;

-- comments.body 部分一致検索用
create index if not exists idx_comments_body_trgm
  on public.comments
  using gin (body gin_trgm_ops);

-- page_contents タイトル/本文
create index if not exists idx_page_contents_title_trgm
  on public.page_contents
  using gin (title gin_trgm_ops);

create index if not exists idx_page_contents_body_trgm
  on public.page_contents
  using gin (body_html gin_trgm_ops);

-- site_changelog タイトル/本文
create index if not exists idx_site_changelog_title_trgm
  on public.site_changelog
  using gin (title gin_trgm_ops);

create index if not exists idx_site_changelog_body_trgm
  on public.site_changelog
  using gin (body_html gin_trgm_ops);

