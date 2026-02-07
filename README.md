# personal-website

個人用ホームページ（Next.js + Supabase）。

動画投稿（YouTube / ニコニコ）、個人開発（GitHub）の紹介と、
コメント機能・管理者ダッシュボードを備えた個人ポータルサイトです。

---

## 概要

このリポジトリは、以下を目的とした **個人用Webサイト** のソースコードです。

* プロフィール・スキルの公開
* YouTube / ニコニコ動画の投稿活動の一覧表示
* 個人開発（GitHubリポジトリ）の紹介
* 各ページにコメント機能を設置
* 管理者画面によるコメント管理・ページ編集・アクセス状況確認

---

## 主な機能

* Googleログイン（管理者用）
* ゲスト / ログインユーザー対応のコメント機能
* コメントへのリアクション機能

  * Good / Not Good
  * 管理者のみの「ハート」リアクション
* プロフィールアイコン管理（Supabase Storage）
* 管理者ダッシュボード

  * コメント管理（非表示・固定）
  * ページ文言編集
  * 訪問者カウントの確認
* YouTube / ニコニコ / GitHub 連携（段階的に実装）

---

## 技術スタック

### フロントエンド

* Next.js（App Router）
* TypeScript
* Tailwind CSS

### バックエンド

* Supabase

  * Authentication（Google OAuth）
  * PostgreSQL
  * Storage

### 開発環境

* pnpm
* Makefile

---

## ディレクトリ構成（予定）

```txt
personal-website/
├─ app/
│  ├─ (public)/
│  ├─ (admin)/
│  └─ layout.tsx
├─ components/
│  ├─ comments/
│  ├─ reactions/
│  ├─ layout/
│  └─ ui/
├─ lib/
│  ├─ supabase/
│  └─ auth/
├─ styles/
│  └─ global.css
├─ Makefile
├─ .env.example
└─ README.md
```

---

## セットアップ（開発）

### 1. リポジトリをクローン

```bash
git clone https://github.com/<your-name>/personal-website.git
cd personal-website
```

### 2. パッケージのインストール

```bash
pnpm install
```

### 3. 環境変数の設定

`.env.example` を参考に `.env.local` を作成してください。

```bash
cp .env.example .env.local
```

### 4. 開発サーバー起動

```bash
make dev
```

---

## 環境変数一覧

```env
NEXT_PUBLIC_SITE_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_EMAIL_WHITELIST=
ADMIN_PATH_SECRET=
```

---

## 開発方針・ルール

* Server Component では状態管理やイベント処理を行わない
* Client Component に状態管理・イベント処理を集約する
* サイト全体の配色は `global.css` の CSS変数で一元管理
* 秘密情報（`.env.local`）は Git にコミットしない

---

## 今後の予定

* YouTube / GitHub API 連携
* ニコニコ動画の安定した取得方式の検討
* コメント機能のスパム対策強化
* 管理者画面のUI改善

---

## ライセンス

本リポジトリは個人用プロジェクトです。
ライセンスは現時点では付与していません。
