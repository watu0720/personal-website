-- v1.3 comment replies, external cache

-- comment_replies テーブル
create table if not exists public.comment_replies (
  id uuid primary key default gen_random_uuid(),
  parent_comment_id uuid not null references public.comments(id) on delete cascade,
  page_key text not null,
  author_user_id uuid not null references auth.users(id),
  author_name text not null,
  author_avatar_url text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_comment_replies_parent_created_at
  on public.comment_replies(parent_comment_id, created_at asc);

create index if not exists idx_comment_replies_page_key
  on public.comment_replies(page_key);

alter table public.comment_replies enable row level security;

-- RLS policies for comment_replies
drop policy if exists comment_replies_select_public on public.comment_replies;
create policy comment_replies_select_public
on public.comment_replies
for select
to public
using (true);

drop policy if exists comment_replies_insert_auth on public.comment_replies;
create policy comment_replies_insert_auth
on public.comment_replies
for insert
to authenticated
with check (author_user_id = auth.uid());

drop policy if exists comment_replies_update_owner on public.comment_replies;
create policy comment_replies_update_owner
on public.comment_replies
for update
to authenticated
using (author_user_id = auth.uid())
with check (author_user_id = auth.uid());

-- external_cache テーブル（外部APIキャッシュ）
create table if not exists public.external_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  cache_key text not null,
  payload_json jsonb not null,
  fetched_at timestamptz not null default now(),
  ttl_seconds int not null default 3600,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, cache_key)
);

create index if not exists idx_external_cache_provider_key
  on public.external_cache(provider, cache_key);

alter table public.external_cache enable row level security;

-- public select OK（キャッシュは公開情報なので可）
drop policy if exists external_cache_select_public on public.external_cache;
create policy external_cache_select_public
on public.external_cache
for select
to public
using (true);

-- comment_replies に admin_heart カラムを追加
alter table public.comment_replies
  add column if not exists admin_heart boolean not null default false,
  add column if not exists admin_heart_by uuid references auth.users(id),
  add column if not exists admin_heart_at timestamptz;

-- comment_reactions テーブルの外部キー制約を削除して、返信にもリアクションを付けられるようにする
-- （comment_id は comments.id と comment_replies.id の両方を参照できるようになる）
alter table public.comment_reactions
  drop constraint if exists comment_reactions_comment_id_fkey;
