import { encode as encodeWebp } from '@jsquash/webp';

// Helper to reliably read any image format (PNG, JPG, WEBP) into raw pixel data
export async function getImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = 0;
    canvas.height = 0;
    bitmap.close();
    throw new Error('Canvas context failed');
  }
  
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  canvas.width = 0;
  canvas.height = 0;
  bitmap.close();
  return imageData;
}

// Standard compression function for Bulk Processing
export async function compressToWebp(file: File): Promise<Blob> {
  const imageData = await getImageData(file);
  // Default quality ~75 is optimal balance for bulk size reduction
  const compressedBuffer = await encodeWebp(imageData);
  return new Blob([compressedBuffer], { type: 'image/webp' });
}

export interface TargetCompressionResult {
  blob: Blob;
  isUnderTarget: boolean;
  isAlreadyUnderTarget: boolean;
  quality: number;
  scale: number;
  width: number;
  height: number;
  smallestAchievedBytes: number;
}

/**
 * Precision binary search to compress an image file to a strict target byte size.
 *
 * Requirements:
 * 1. Treat N KB as N * 1000 bytes (decimal standard for portal limits).
 * 2. Aim for safety margin (98.5% - 99% of limit) so file passes both decimal and 1024-based checks.
 * 3. Track best valid result: Largest output <= targetBytes (never return overshooting iteration).
 * 4. Two-stage fallback: First search quality down to 0.15 floor. If still over target, scale resolution from 0.90 down to 0.15.
 * 5. Already-under-target guard: If file is already <= target, return untouched.
 */
export async function compressImageToTarget(
  file: File,
  targetBytes: number,
  onProgress?: (message: string) => void
): Promise<TargetCompressionResult> {
  // Guard: If file is already under target, return original untouched
  if (file.size <= targetBytes) {
    return {
      blob: file,
      isUnderTarget: true,
      isAlreadyUnderTarget: true,
      quality: 100,
      scale: 1.0,
      width: 0,
      height: 0,
      smallestAchievedBytes: file.size,
    };
  }

  const bitmap = await createImageBitmap(file);
  const origWidth = bitmap.width;
  const origHeight = bitmap.height;

  // Aim for 98.8% safety target to ensure it reliably passes strict submission gateways
  const safetyTargetBytes = Math.floor(targetBytes * 0.988);

  let bestValidBuffer: ArrayBuffer | null = null;
  let bestQuality = 0;
  let bestScale = 1.0;
  let bestWidth = origWidth;
  let bestHeight = origHeight;

  let smallestBuffer: ArrayBuffer | null = null;
  let smallestAchievedBytes = Infinity;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D context unavailable');
  }

  try {
    // Stage 1: Search quality at 100% resolution (quality floor: 15)
    onProgress?.('Stage 1/2: Optimizing quality at full resolution...');
    canvas.width = origWidth;
    canvas.height = origHeight;
    ctx.drawImage(bitmap, 0, 0, origWidth, origHeight);
    const fullResImageData = ctx.getImageData(0, 0, origWidth, origHeight);

    let minQ = 15;
    let maxQ = 95;

    for (let i = 0; i < 7; i++) {
      if (minQ > maxQ) break;
      const midQ = Math.floor((minQ + maxQ) / 2);
      onProgress?.(`Stage 1/2: Quality pass ${i + 1}/7 (q=${midQ})...`);

      const buffer = await encodeWebp(fullResImageData, { quality: midQ });
      const size = buffer.byteLength;

      if (size < smallestAchievedBytes) {
        smallestAchievedBytes = size;
        smallestBuffer = buffer;
      }

      if (size <= safetyTargetBytes || (size <= targetBytes && !bestValidBuffer)) {
        // Valid result! We want the highest quality that stays <= targetBytes
        if (!bestValidBuffer || size > bestValidBuffer.byteLength) {
          bestValidBuffer = buffer;
          bestQuality = midQ;
          bestScale = 1.0;
          bestWidth = origWidth;
          bestHeight = origHeight;
        }
        minQ = midQ + 1; // Try to get higher quality
      } else {
        maxQ = midQ - 1; // Overshot target: lower quality
      }
    }

    // If Stage 1 found a valid buffer under target, return it!
    if (bestValidBuffer) {
      return {
        blob: new Blob([bestValidBuffer], { type: 'image/webp' }),
        isUnderTarget: true,
        isAlreadyUnderTarget: false,
        quality: bestQuality,
        scale: bestScale,
        width: bestWidth,
        height: bestHeight,
        smallestAchievedBytes: bestValidBuffer.byteLength,
      };
    }

    // Stage 2: Quality floor of 15 was still too large. Downscale resolution from 0.85 to 0.15.
    const scaleSteps = [0.85, 0.70, 0.55, 0.40, 0.25, 0.15];

    for (let sIdx = 0; sIdx < scaleSteps.length; sIdx++) {
      const scale = scaleSteps[sIdx];
      const curWidth = Math.max(1, Math.round(origWidth * scale));
      const curHeight = Math.max(1, Math.round(origHeight * scale));

      onProgress?.(`Stage 2/2: Downscaling resolution to ${Math.round(scale * 100)}% (${curWidth}×${curHeight})...`);

      canvas.width = curWidth;
      canvas.height = curHeight;
      ctx.clearRect(0, 0, curWidth, curHeight);
      ctx.drawImage(bitmap, 0, 0, curWidth, curHeight);
      const scaledImageData = ctx.getImageData(0, 0, curWidth, curHeight);

      let sMinQ = 15;
      let sMaxQ = 90;

      for (let pass = 0; pass < 5; pass++) {
        if (sMinQ > sMaxQ) break;
        const midQ = Math.floor((sMinQ + sMaxQ) / 2);

        const buffer = await encodeWebp(scaledImageData, { quality: midQ });
        const size = buffer.byteLength;

        if (size < smallestAchievedBytes) {
          smallestAchievedBytes = size;
          smallestBuffer = buffer;
        }

        if (size <= safetyTargetBytes || (size <= targetBytes && !bestValidBuffer)) {
          if (!bestValidBuffer || size > bestValidBuffer.byteLength) {
            bestValidBuffer = buffer;
            bestQuality = midQ;
            bestScale = scale;
            bestWidth = curWidth;
            bestHeight = curHeight;
          }
          sMinQ = midQ + 1;
        } else {
          sMaxQ = midQ - 1;
        }
      }

      // If we found a valid candidate at this scale, we can return it
      if (bestValidBuffer) {
        break;
      }
    }

    if (bestValidBuffer) {
      return {
        blob: new Blob([bestValidBuffer], { type: 'image/webp' }),
        isUnderTarget: true,
        isAlreadyUnderTarget: false,
        quality: bestQuality,
        scale: bestScale,
        width: bestWidth,
        height: bestHeight,
        smallestAchievedBytes: bestValidBuffer.byteLength,
      };
    }

    // If target is physically impossible even at scale 0.15 & q=15:
    // Return the absolute smallest achieved output (never crash) and mark isUnderTarget=false
    const fallbackBuffer = smallestBuffer || (await encodeWebp(fullResImageData, { quality: 15 }));
    return {
      blob: new Blob([fallbackBuffer], { type: 'image/webp' }),
      isUnderTarget: false,
      isAlreadyUnderTarget: false,
      quality: 15,
      scale: 0.15,
      width: Math.max(1, Math.round(origWidth * 0.15)),
      height: Math.max(1, Math.round(origHeight * 0.15)),
      smallestAchievedBytes: fallbackBuffer.byteLength,
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    bitmap.close();
  }
}

// Backward compatible export for existing callers
export async function compressToTarget(imageData: ImageData, targetBytes: number): Promise<ArrayBuffer> {
  let minQ = 15;
  let maxQ = 90;
  let bestBuffer: ArrayBuffer | null = null;

  for (let i = 0; i < 7; i++) {
    if (minQ > maxQ) break;
    const midQ = Math.floor((minQ + maxQ) / 2);
    const buffer = await encodeWebp(imageData, { quality: midQ });
    const size = buffer.byteLength;

    if (size <= targetBytes) {
      if (!bestBuffer || size > bestBuffer.byteLength) {
        bestBuffer = buffer;
      }
      minQ = midQ + 1;
    } else {
      maxQ = midQ - 1;
    }
  }

  if (!bestBuffer) {
    bestBuffer = await encodeWebp(imageData, { quality: 15 });
  }

  return bestBuffer;
}
