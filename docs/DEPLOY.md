# 本番環境デプロイ手順

## 前提

- 本番用の Supabase プロジェクトを**新規作成**する場合の手順です。
- 開発用 Supabase には **0001_baseline を適用しない**でください（すでに同じスキーマが存在するため）。

---

## 1. 本番 Supabase へのマイグレーション適用順

本番で **新規に** Supabase プロジェクトを作成した場合、以下の順で SQL を実行します。

1. **0001_baseline.sql** … スキーマ全体（テーブル・インデックス・RLS・GRANT）
2. **0002_seed_common.sql** … 共通 seed（`page_contents` の初期行など）
3. **0003_v1_1.sql** … v1.1 差分（例: `site_changelog` の RLS ポリシー）

### 実行方法

- **Supabase Dashboard** → SQL Editor で、上記の順に各ファイルの内容を貼り付けて実行する  
  または
- **Supabase CLI** で `supabase link --project-ref <本番ProjectRef>` のうえ、  
  `supabase db push` で `supabase/migrations/` を適用（本番が空の状態なら 0001 → 0002 → 0003 の順で適用されます）

---

## 2. 本番で管理者を追加する手順

`admin_roles` は環境ごとにユーザーID（UUID）が異なるため、**マイグレーションには含めません**。本番で次の手順で追加します。

1. 本番サイトで、管理者にしたいアカウントで **Google ログイン** を 1 回行う。
2. **Supabase Dashboard**（本番プロジェクト）→ **Authentication** → **Users** で、そのユーザーの **User UID** をコピーする。
3. **SQL Editor** で以下を実行する（`<USER_UID>` をコピーした UUID に置き換え）。

```sql
INSERT INTO public.admin_roles (user_id, role, created_by)
VALUES ('<USER_UID>', 'admin', '<USER_UID>')
ON CONFLICT (user_id) DO NOTHING;
```

---

## 3. 環境変数（本番）

Vercel 等の本番環境に、少なくとも以下を設定してください。

- `NEXT_PUBLIC_SUPABASE_URL` … 本番 Supabase の URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` … 本番の anon key
- `SUPABASE_SERVICE_ROLE_KEY` … 本番の service_role key（**サーバー専用**）
- `ADMIN_PATH_SECRET` … 管理画面用の秘密パス（例: `admin-xxxx`）
- その他: TinyMCE / YouTube / GitHub / ニコニコ など、利用する機能に応じた環境変数

---

## 4. 開発環境でマイグレーションを適用する場合

- **0001_baseline** は **適用しない**（開発 DB には既にスキーマが存在するため）。
- **0002_seed_common** … 必要なら実行可（`ON CONFLICT DO NOTHING` のため重複投入は無視されます）。
- **0003_v1_1** … 開発 DB に `site_changelog` の RLS を入れたい場合に実行。
