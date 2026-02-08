"use client";

import { useRouter } from "next/navigation";

type AdminGateProps = {
  adminPath: string;
  mode: "login" | "forbidden";
};

export function AdminGate({ adminPath, mode }: AdminGateProps) {
  const router = useRouter();

  async function signInWithGoogle() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/${encodeURIComponent(adminPath)}` },
    });
  }

  if (mode === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
          <h1 className="mb-2 text-xl font-semibold text-foreground">403 Forbidden</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            このアカウントは管理者ではありません。アクセス権限がありません。
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <h1 className="mb-4 text-xl font-semibold text-foreground">管理者ログイン</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Googleでログインしてください。管理者のみアクセスできます。
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Googleでログイン
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
          このページへのリンクはサイト上に表示されません。
        </p>
      </div>
    </div>
  );
}
