import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';

// If this line throws a "cannot resolve" build error, the exact worker
// filename shipped by your installed pdfjs-dist version differs slightly —
// check node_modules/pdfjs-dist/build/ for the real filename and swap it in
// above (still keep the trailing ?url).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// A page counts as "blank" if less than this fraction of its pixels are
// meaningfully non-white. Not set to 0, since scanned "blank" pages usually
// carry a little scanner noise or shadow.
const BLANK_THRESHOLD = 0.005;
// Render at a small size just to check blankness — full resolution isn't
// needed for this and would be much slower for nothing gained.
const RENDER_TARGET_PX = 400;

async function isPageBlank(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<boolean> {
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = RENDER_TARGET_PX / Math.max(baseViewport.width, baseViewport.height);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  await page.render({ canvasContext: ctx, canvas, viewport }).promise;

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const totalPixels = width * height;
  let nonWhitePixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
      nonWhitePixels++;
    }
  }

  return nonWhitePixels / totalPixels < BLANK_THRESHOLD;
}

export interface RemoveBlankPagesResult {
  bytes: Uint8Array;
  totalPages: number;
  removedPages: number[];
}

export async function removeBlankPages(file: File): Promise<RemoveBlankPagesResult> {
  const arrayBuffer = await file.arrayBuffer();

  const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const totalPages = pdfJsDoc.numPages;

  const blankPages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (await isPageBlank(pdfJsDoc, i)) {
      blankPages.push(i);
    }
  }

  // If every page looked blank, detection likely misfired on this file —
  // play it safe and return the original untouched rather than an empty PDF.
  if (blankPages.length === totalPages) {
    return { bytes: new Uint8Array(arrayBuffer), totalPages, removedPages: [] };
  }

  const sourceDoc = await PDFDocument.load(arrayBuffer);
  const newDoc = await PDFDocument.create();

  const keepIndexes = Array.from({ length: totalPages }, (_, i) => i).filter(
    (index) => !blankPages.includes(index + 1)
  );

  const copiedPages = await newDoc.copyPages(sourceDoc, keepIndexes);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const bytes = await newDoc.save();

  return { bytes, totalPages, removedPages: blankPages };
}
