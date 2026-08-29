// Instantiate the Web Worker using Vite's native URL structure
const worker = new Worker(new URL('./compressionWorker.ts', import.meta.url), { type: 'module' });

let messageId = 0;
const callbacks = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

// Listen for the worker to finish and resolve the correct Promise
worker.onmessage = (e) => {
  const { id, success, buffer, error } = e.data;
  const cb = callbacks.get(id);
  if (cb) {
    if (success) {
      cb.resolve(buffer);
    } else {
      cb.reject(new Error(error));
    }
    callbacks.delete(id);
  }
};

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

export async function compressToWebp(file: File): Promise<Blob> {
  const imageData = await getImageData(file);
  const id = messageId++;
  
  return new Promise((resolve, reject) => {
    callbacks.set(id, {
      resolve: (buffer: ArrayBuffer) => resolve(new Blob([buffer], { type: 'image/webp' })),
      reject
    });
    
    worker.postMessage({ id, action: 'BULK', imageData });
  });
}

export async function compressToTarget(imageData: ImageData, targetBytes: number): Promise<ArrayBuffer> {
  const id = messageId++;
  
  return new Promise((resolve, reject) => {
    callbacks.set(id, { resolve, reject });
    worker.postMessage({ id, action: 'TARGET', imageData, targetBytes });
  });
}