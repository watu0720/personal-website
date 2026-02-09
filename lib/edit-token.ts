import { createHash } from "crypto";

export function hashEditToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyEditToken(plain: string, hash: string | null): boolean {
  if (!hash) return false;
  return hashEditToken(plain) === hash;
}
