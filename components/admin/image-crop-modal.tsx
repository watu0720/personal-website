"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob, type PixelCrop } from "@/lib/crop-image";

type CropType = "profile" | "header" | "thumbnail";

type Props = {
  open: boolean;
  imageSrc: string;
  cropType: CropType | "thumbnail";
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

export function ImageCropModal({
  open,
  imageSrc,
  cropType,
  onConfirm,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);

  const aspect =
    cropType === "profile" ? 1 : cropType === "thumbnail" ? 16 / 9 : 21 / 9;

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPx: Area) => {
      setCroppedAreaPixels({
        x: Math.round(croppedAreaPx.x),
        y: Math.round(croppedAreaPx.y),
        width: Math.round(croppedAreaPx.width),
        height: Math.round(croppedAreaPx.height),
      });
    },
    []
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        "image/jpeg",
        0.92
      );
      onConfirm(blob);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-card shadow-lg">
        <div className="relative h-[50vh] w-full shrink-0 overflow-hidden rounded-t-xl bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { backgroundColor: "#000" } }}
          />
        </div>
        <div className="border-t px-4 py-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">ズーム</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !croppedAreaPixels}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "保存中..." : "トリミングして保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
