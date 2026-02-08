"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

type RichTextEditorProps = {
  apiKey: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
};

export function RichTextEditor({
  apiKey,
  value,
  onChange,
  disabled,
}: RichTextEditorProps) {
  const editorRef = useRef<unknown>(null);

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        TinyMCE APIキー（NEXT_PUBLIC_TINYMCE_API_KEY）が設定されていません。.env.local を確認してください。
      </div>
    );
  }

  return (
    <Editor
      apiKey={apiKey}
      value={value}
      onInit={(_ev, editor) => {
        editorRef.current = editor;
      }}
      onEditorChange={(content) => onChange(content)}
      disabled={disabled}
      init={{
        height: 420,
        menubar: false,
        plugins: [
          "link",
          "lists",
          "autolink",
          "charmap",
          "searchreplace",
          "visualblocks",
          "code",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic | bullist numlist | link | removeformat | code",
        paste_data_images: false,
        link_default_protocol: "https",
        link_assume_external_targets: true,
        content_style: `
          pre { font-family: monospace; overflow-x: auto; white-space: pre; }
          code { font-family: monospace; }
        `,
      }}
    />
  );
}
