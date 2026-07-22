import { decode as decodeJpeg } from '@jsquash/jpeg';
import { encode as encodeWebp } from '@jsquash/webp';

// Your existing standard compression function
export async function compressToWebp(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const rawImageData = await decodeJpeg(arrayBuffer);
  const compressedBuffer = await encodeWebp(rawImageData);
  
  return new Blob([compressedBuffer], { type: 'image/webp' });
}

// NEW: The binary search algorithm for target file sizes
export async function compressToTarget(imageData: ImageData, targetBytes: number): Promise<ArrayBuffer> {
  let minQ = 0;
  let maxQ = 100;
  let bestBuffer: ArrayBuffer | null = null;
  let bestSizeDiff = Infinity;

  // Run a binary search loop up to 8 times to find the perfect quality
  for (let i = 0; i < 8; i++) {
    const midQ = Math.floor((minQ + maxQ) / 2);
    
    // Encode image at the current middle quality
    const buffer = await encodeWebp(imageData, { quality: midQ });
    const size = buffer.byteLength;

    if (size <= targetBytes) {
      // If it's under the target, save it as the best so far
      const diff = targetBytes - size;
      if (diff < bestSizeDiff) {
        bestSizeDiff = diff;
        bestBuffer = buffer;
      }
      // Try to get higher quality (closer to the target size limit)
      minQ = midQ + 1; 
    } else {
      // Too big, lower the quality
      maxQ = midQ - 1; 
    }
  }

  // Fallback: If we couldn't get it under the target even at lowest quality, just return quality 0
  if (!bestBuffer) {
     bestBuffer = await encodeWebp(imageData, { quality: 0 });
  }

  return bestBuffer;
}