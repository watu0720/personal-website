import sanitizeHtml from "sanitize-html";

/**
 * Server-side sanitization for TinyMCE HTML before saving.
 * Allowed tags/attributes are restricted for XSS prevention.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "a",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: (_tagName: string, attribs: Record<string, string>) => {
        const href = attribs.href ?? "";
        const ok = /^https?:\/\//i.test(href);
        return {
          tagName: "a",
          attribs: ok
            ? { href, target: "_blank", rel: "noopener noreferrer" }
            : { href: "#", target: "_self", rel: "" },
        };
      },
    },
  });
}
