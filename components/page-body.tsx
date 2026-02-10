"use client";

import { sanitizeRichText } from "@/lib/sanitize";

type PageBodyProps = {
  html: string;
  className?: string;
};

/**
 * Renders sanitized HTML (from TinyMCE). Pre/code kept readable.
 */
export function PageBody({ html, className = "" }: PageBodyProps) {
  const sanitized = sanitizeRichText(html);

  return (
    <div
      className={`[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-0.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 ${className}`}
    >
      <div
        className="[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm [&_pre]:font-mono [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </div>
  );
}
