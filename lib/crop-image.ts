/**
 * Create image from URL (object URL or data URL).
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Returns a blob for the cropped image.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  mimeType: string = "image/jpeg",
  quality: number = 0.92
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      mimeType,
      quality
    );
  });
}
