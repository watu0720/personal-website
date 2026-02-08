# personal-website

個人制作のポートフォリオ／作品紹介用Webサイトです。

- YouTube・ニコニコ動画・GitHub など外部サービスと連携
- コメント・通報・管理者機能を備えた個人HP
- Supabase + Next.js によるフルスタック構成

本リポジトリは **v1 完成版** を目標に、Sprint 単位で段階的に実装されています。

---

## 概要

### 主な機能

- **Home**
  - 最新通知（YouTube / ニコニコ / コメント）

- **Profile**
  - プロフィール表示
  - スキル一覧（登録順・大量時は「もっと見る」）

- **YouTube**
  - 投稿動画一覧
  - プレイリスト一覧（外部遷移）
  - 投稿／プレイリスト更新通知

- **ニコニコ動画**
  - 投稿動画一覧（RSS）
  - マイリスト一覧（3種）
  - 投稿／マイリスト更新通知

- **Dev（GitHub）**
  - 公開リポジトリ一覧（通知なし）

- **コメント機能（全ページ共通）**
  - ログインユーザー／ゲスト投稿対応
  - Good / Not Good
  - 管理者ハート
  - 通報・自動非表示

- **管理者画面（Admin）**
  - Googleログイン（Supabase Auth）
  - CMS（TinyMCE）によるページ編集
  - コメント／通報管理
  - 訪問者統計（PV / ユニーク）

---

## 技術スタック

| 区分           | 技術                                         |
| -------------- | -------------------------------------------- |
| フロントエンド | Next.js（App Router） / TypeScript           |
| UI             | Tailwind CSS                                 |
| 認証           | Supabase Auth（Google）                      |
| DB / Storage   | Supabase                                     |
| CMS            | TinyMCE                                      |
| 外部連携       | YouTube Data API / ニコニコ RSS / GitHub API |
| パッケージ管理 | pnpm                                         |
| デプロイ       | Vercel                                       |

---

## 開発環境

### 必要なもの

- Node.js（推奨：LTS）
- pnpm
- Supabase アカウント
- Google Cloud（OAuth / YouTube API）
- GitHub アカウント

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/<your-account>/watu0720-works.git
cd watu0720-works
```

### 2. 環境変数の設定

`.env.local` を作成し、以下を設定してください。

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_PATH_SECRET=admin-xxxxxxxx

# TinyMCE
NEXT_PUBLIC_TINYMCE_API_KEY=

# YouTube
YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=

# GitHub
GITHUB_TOKEN=
```

※ `SUPABASE_SERVICE_ROLE_KEY` は **必ずサーバー側のみで使用**してください。

---

## 開発コマンド

すべて `Makefile` 経由で実行します。

```bash
make setup      # 依存関係のインストール
make dev        # 開発サーバー起動
make lint       # ESLint
make typecheck  # TypeScriptチェック
make build      # ビルド
```

---

## 管理者（Admin）について

### 管理者画面へのアクセス

- URL：`/{ADMIN_PATH_SECRET}`
- 通常のナビゲーションには表示されません
- 直接URLを入力してアクセスします

### 管理者の追加方法

1. 追加したいユーザーに **Googleログインで一度ログイン**してもらう
2. Supabase の `auth.users` にレコードが作成される
3. 以下SQLで管理者に追加

```sql
insert into public.admin_roles (user_id, role, created_by)
values ('<user_id>', 'admin', '<your_user_id>');
```

※ 最後の管理者は削除できない仕様です。

---

## セキュリティ上の注意

- APIキーは **クライアントに露出させない**
- `ADMIN_PATH_SECRET` は公開しない（画面・HTML に表示しない）
- 管理操作はすべて Server 側で権限チェック
- `robots.txt` で `/admin-` を Disallow しており、管理URLはクロール対象外

---

## 開発方針・ルール

- Server Component では状態管理やイベント処理を行わない
- Client Component に状態管理・イベント処理を集約する
- サイト全体の配色は `global.css` の CSS変数で一元管理
- 秘密情報（`.env.local`）は Git にコミットしない

---

## デプロイ

### Vercel

1. 本リポジトリを Vercel に接続
2. 環境変数を Vercel 側にも設定
3. デプロイ

### 独自ドメイン

- ドメイン：`watu0720-works.com`
- HTTPS 有効

---

## 今後の拡張予定

- Home固定お知らせ
- コメントNGワード管理
- APIキー管理画面

（Sprint 6 参照）

---

## ライセンス

- 個人制作物のため、無断転載・再利用はご遠慮ください。
