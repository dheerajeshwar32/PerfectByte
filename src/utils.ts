// Shared utility functions — single source of truth (#15: Deduplicate formatBytes)

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export interface ImageMeta {
  width: number;
  height: number;
  fileSize: number;
  fileType: string;
  fileName: string;
}

/** Extract basic metadata from an image file (dimensions, size, type). */
export async function getImageMeta(file: File): Promise<ImageMeta> {
  const bitmap = await createImageBitmap(file);
  const meta: ImageMeta = {
    width: bitmap.width,
    height: bitmap.height,
    fileSize: file.size,
    fileType: file.type || 'unknown',
    fileName: file.name,
  };
  bitmap.close();
  return meta;
}

/** Get raw ImageData from any image file via canvas. */
export async function getImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  bitmap.close();
  return imageData;
}

