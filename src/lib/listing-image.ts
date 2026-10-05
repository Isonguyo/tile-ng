const MAX_IMAGE_EDGE = 1920;
const WEBP_QUALITY = 0.82;
const DIRECT_PREVIEW_SIZE = 450 * 1024;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Downscale and compress listing photos before upload so mobile pages stay light. */
export async function optimizeListingImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  const bitmap = await createImageBitmap(file);
  let canvas: HTMLCanvasElement | null = null;
  try {
    const longestEdge = Math.max(bitmap.width, bitmap.height);
    if (longestEdge <= MAX_IMAGE_EDGE && file.size <= DIRECT_PREVIEW_SIZE) return file;

    const scale = Math.min(1, MAX_IMAGE_EDGE / longestEdge);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "tile-photo";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
