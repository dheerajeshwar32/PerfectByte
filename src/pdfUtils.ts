import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Initialize the PDF.js worker for Vite
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const BLANK_THRESHOLD = 0.005;
const RENDER_TARGET_PX = 400;

function formatPdfError(err: unknown): Error {
  const error = err as { name?: string; message?: string };
  if (error?.name === 'PasswordException') {
    return new Error('This PDF is password-protected. Please unlock or remove the password before processing.');
  }
  if (error?.name === 'InvalidPDFException') {
    return new Error('The PDF file is corrupted or not a valid PDF document.');
  }
  return new Error(error?.message || 'Failed to process PDF document.');
}

async function isPageBlank(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<boolean> {
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = RENDER_TARGET_PX / Math.max(baseViewport.width, baseViewport.height);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = 0;
    canvas.height = 0;
    throw new Error('Canvas context failed');
  }

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const totalPixels = width * height;
  let nonWhitePixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
      nonWhitePixels++;
    }
  }

  canvas.width = 0;
  canvas.height = 0;
  return nonWhitePixels / totalPixels < BLANK_THRESHOLD;
}

export interface RemoveBlankPagesResult {
  bytes: Uint8Array;
  totalPages: number;
  removedPages: number[];
}

export async function removeBlankPages(file: File): Promise<RemoveBlankPagesResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const totalPages = pdfJsDoc.numPages;

    const blankPages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (await isPageBlank(pdfJsDoc, i)) {
        blankPages.push(i);
      }
    }

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
  } catch (err) {
    throw formatPdfError(err);
  }
}

/**
 * Compresses a PDF by rasterizing each page to an optimized JPEG and embedding it.
 * Preserves original page width, height, and orientation (portrait/landscape).
 * Enforces quality floor (0.15) and cleans up canvas memory after every page.
 */
export async function compressPDF(file: File, quality = 0.5): Promise<Blob> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const numPages = pdf.numPages;
    const newPdf = await PDFDocument.create();

    const enforcedQuality = Math.max(0.15, Math.min(0.95, quality));

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      
      // 1. Get base viewport to preserve exact physical page dimensions and orientation
      const baseViewport = page.getViewport({ scale: 1.0 });

      // 2. Render viewport for raster image quality (1.2x scale for higher quality, 1.0x for lower)
      const renderScale = enforcedQuality > 0.5 ? 1.25 : 1.0;
      const renderViewport = page.getViewport({ scale: renderScale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(renderViewport.width);
      canvas.height = Math.ceil(renderViewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        canvas.width = 0;
        canvas.height = 0;
        continue;
      }

      await page.render({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

      // 3. Convert to compressed JPEG using quality setting
      const base64Jpg = canvas.toDataURL('image/jpeg', enforcedQuality);
      canvas.width = 0;
      canvas.height = 0;

      const imageBytes = await fetch(base64Jpg).then((res) => res.arrayBuffer());
      const embeddedImage = await newPdf.embedJpg(imageBytes);

      // 4. Add page with original dimensions (preserving landscape/portrait)
      const newPage = newPdf.addPage([baseViewport.width, baseViewport.height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });
    }

    const compressedBytes = await newPdf.save({ useObjectStreams: true });
    return new Blob([compressedBytes as BlobPart], { type: 'application/pdf' });
  } catch (err) {
    throw formatPdfError(err);
  }
}

/** Merge multiple PDF files into a single document. */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  try {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
  } catch (err) {
    throw formatPdfError(err);
  }
}

/** Split a PDF by extracting specific pages (0-based indices). */
export async function splitPDF(file: File, pageIndices: number[]): Promise<Uint8Array> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    return await newPdf.save();
  } catch (err) {
    throw formatPdfError(err);
  }
}

/** Get the total number of pages in a PDF. */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPageCount();
  } catch (err) {
    throw formatPdfError(err);
  }
}
