"use client";

import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthStatusProps = {
  /** ヘッダー用: アイコンのみ表示し、ホバーで名前・メール・ログアウトを表示 */
  compact?: boolean;
};

export function AuthStatus({ compact = false }: AuthStatusProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function signInWithGoogle() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  }

  if (loading) {
    return (
      <span
        className={
          compact
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
            : "ml-2 rounded-lg px-3 py-2 text-sm text-muted-foreground"
        }
      >
        {compact ? (
          <span className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/50" />
        ) : (
          "確認中..."
        )}
      </span>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signInWithGoogle}
        className={
          compact
            ? "shrink-0 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 md:px-3 md:py-2 md:text-sm"
            : "ml-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        }
        title="Googleでログイン"
      >
        Googleでログイン
      </button>
    );
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl = meta?.avatar_url as string | undefined;
  const fullName = (meta?.full_name ?? meta?.name) as string | undefined;
  const displayName = fullName?.trim() || user.email?.split("@")[0] || "ログインユーザー";
  const email = user.email ?? "";

  if (compact) {
    return (
      <div className="group relative shrink-0">
        <div
          className="flex h-8 w-8 cursor-default items-center justify-center rounded-full ring-1 ring-transparent transition-[box-shadow] hover:ring-border"
          aria-label={`${displayName} (${email})`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserIcon className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>
        {/* 上端にパディングを設けてアイコンとの隙間をホバー領域でつなぎ、カーソルがポップ内に入りやすくする */}
        <div className="pointer-events-none absolute right-0 top-full z-50 min-w-48 rounded-lg border border-border bg-popover pt-2 shadow-md opacity-0 transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="group relative px-3 pb-3 pt-0">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {displayName && (
                <span className="font-medium text-foreground">{displayName}</span>
              )}
              {email && <span className="break-all">{email}</span>}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-2 flex items-center gap-2">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-6 w-6 shrink-0 rounded-full object-cover"
          width={24}
          height={24}
        />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserIcon className="h-3 w-3 text-muted-foreground" aria-hidden />
        </span>
      )}
      <span className="flex flex-col items-end text-xs text-muted-foreground">
        {displayName && <span className="font-medium text-foreground">{displayName}</span>}
        {email && <span>{email}</span>}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        ログアウト
      </button>
    </div>
  );
}
