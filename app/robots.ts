import type { MetadataRoute } from "next";

/**
 * Admin paths (e.g. /admin-xxx) are disallowed for crawlers.
 * We use prefix /admin- so the exact secret is not exposed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin-",
    },
  };
}
