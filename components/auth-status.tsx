"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthStatus() {
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
      <span className="ml-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
        確認中...
      </span>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signInWithGoogle}
        className="ml-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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

  return (
    <div className="ml-2 flex items-center gap-2">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt=""
          className="h-6 w-6 shrink-0 rounded-full object-cover"
          width={24}
          height={24}
        />
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
