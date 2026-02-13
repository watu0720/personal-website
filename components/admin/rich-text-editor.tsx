"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type RichTextEditorProps = {
  apiKey: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  newsId?: string | null; // お知らせ編集時はIDを渡す
};

export function RichTextEditor({
  apiKey,
  value,
  onChange,
  disabled,
  newsId,
}: RichTextEditorProps) {
  const editorRef = useRef<unknown>(null);
  const supabase = createClient();

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
          "image",
        ],
        toolbar:
          "undo redo | blocks | bold italic | bullist numlist | link image | removeformat | code",
        paste_data_images: false,
        link_default_protocol: "https",
        link_assume_external_targets: true,
        images_upload_handler: async (blobInfo, progress) => {
          return new Promise(async (resolve, reject) => {
            try {
              // 認証トークンを取得
              const { data: sess } = await supabase.auth.getSession();
              const token = sess.session?.access_token;
              if (!token) {
                reject({ message: "認証が必要です。ログインし直してください。", remove: true });
                return;
              }

              const formData = new FormData();
              formData.append("file", blobInfo.blob(), blobInfo.filename());
              if (newsId) {
                formData.append("news_id", newsId);
              }

              const xhr = new XMLHttpRequest();
              xhr.withCredentials = false;
              xhr.open("POST", "/api/admin/news/upload-image");
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);

              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  progress((e.loaded / e.total) * 100);
                }
              };

              xhr.onload = () => {
                if (xhr.status === 403 || xhr.status === 404) {
                  reject({ message: "HTTP Error: " + xhr.status, remove: true });
                  return;
                }

                if (xhr.status < 200 || xhr.status >= 300) {
                  try {
                    const json = JSON.parse(xhr.responseText);
                    const errorMsg = json?.error || `HTTP Error: ${xhr.status}`;
                    reject({ message: errorMsg, remove: true });
                  } catch {
                    reject({ message: `HTTP Error: ${xhr.status}`, remove: true });
                  }
                  return;
                }

                try {
                  const json = JSON.parse(xhr.responseText);
                  if (!json || typeof json.location !== "string") {
                    reject({ message: "Invalid response: " + xhr.responseText, remove: true });
                    return;
                  }
                  resolve(json.location);
                } catch (e) {
                  reject({ message: "Failed to parse response: " + xhr.responseText, remove: true });
                }
              };

              xhr.onerror = () => {
                reject({ message: "Image upload failed due to a XHR Transport error", remove: true });
              };

              xhr.send(formData);
            } catch (error) {
              reject({
                message: error instanceof Error ? error.message : "Unknown error",
                remove: true,
              });
            }
          });
        },
        content_style: `
          pre { font-family: monospace; overflow-x: auto; white-space: pre; }
          code { font-family: monospace; }
        `,
      }}
    />
  );
}
