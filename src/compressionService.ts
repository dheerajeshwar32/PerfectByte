import { encode as encodeWebp } from '@jsquash/webp';

// Helper to reliably read any image format (PNG, JPG, WEBP) into raw pixel data
async function getImageData(file: File): Promise<ImageData> {
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

// Standard compression function for Bulk Processing
export async function compressToWebp(file: File) {
  const imageData = await getImageData(file);
  // Encode to WebP (defaults to ~75 quality, excellent for bulk size reduction)
  const compressedBuffer = await encodeWebp(imageData);
  
  return new Blob([compressedBuffer], { type: 'image/webp' });
}

// Optimized binary search for Target File Sizes
export async function compressToTarget(imageData: ImageData, targetBytes: number): Promise<ArrayBuffer> {
  // 1. Early Exit: Try a high-quality baseline first
  const highQualityBuffer = await encodeWebp(imageData, { quality: 90 });
  if (highQualityBuffer.byteLength <= targetBytes) {
    return highQualityBuffer;
  }

  let minQ = 0;
  let maxQ = 89; 
  let bestBuffer: ArrayBuffer | null = null;
  let bestSizeDiff = Infinity;

  // 2. Binary search for optimal quality
  for (let i = 0; i < 8; i++) {
    if (minQ > maxQ) break; 

    const midQ = Math.floor((minQ + maxQ) / 2);
    const buffer = await encodeWebp(imageData, { quality: midQ });
    const size = buffer.byteLength;

    if (size <= targetBytes) {
      // Under target: save as best, but try to push quality higher
      const diff = targetBytes - size;
      if (diff < bestSizeDiff) {
        bestSizeDiff = diff;
        bestBuffer = buffer;
      }
      minQ = midQ + 1; 
    } else {
      // Over target: lower the quality
      maxQ = midQ - 1; 
    }
  }

  // 3. Fallback: If it's still too big at lowest quality
  if (!bestBuffer) {
    bestBuffer = await encodeWebp(imageData, { quality: 0 });
  }

  return bestBuffer;
}