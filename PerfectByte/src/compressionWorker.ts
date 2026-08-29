import { encode as encodeWebp } from '@jsquash/webp';

self.onmessage = async (e: MessageEvent) => {
  const { id, action, imageData, targetBytes } = e.data;

  try {
    if (action === 'BULK') {
      const buffer = await encodeWebp(imageData);
      // Transfer the buffer back to the main thread instantly
      self.postMessage({ id, success: true, buffer }, { transfer: [buffer] });
    } 
    else if (action === 'TARGET') {
      const highQualityBuffer = await encodeWebp(imageData, { quality: 90 });
      
      if (highQualityBuffer.byteLength <= targetBytes) {
        self.postMessage({ id, success: true, buffer: highQualityBuffer }, { transfer: [highQualityBuffer] });
        return;
      }

      let minQ = 0;
      let maxQ = 89;
      let bestBuffer: ArrayBuffer | null = null;
      let bestSizeDiff = Infinity;

      for (let i = 0; i < 8; i++) {
        if (minQ > maxQ) break;
        const midQ = Math.floor((minQ + maxQ) / 2);
        const buffer = await encodeWebp(imageData, { quality: midQ });
        const size = buffer.byteLength;

        if (size <= targetBytes) {
          const diff = targetBytes - size;
          if (diff < bestSizeDiff) {
            bestSizeDiff = diff;
            bestBuffer = buffer;
          }
          minQ = midQ + 1;
        } else {
          maxQ = midQ - 1;
        }
      }

      if (!bestBuffer) {
        bestBuffer = await encodeWebp(imageData, { quality: 0 });
      }
      
      self.postMessage({ id, success: true, buffer: bestBuffer }, { transfer: [bestBuffer] });
    }
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error.message });
  }
};