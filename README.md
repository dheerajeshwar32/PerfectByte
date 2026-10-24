# PerfectByte

> **Zero-Server Edge Compute File Optimization, Conversion & AI Command Suite**  
> 🔗 Live Application: [https://perfectbyte.vercel.app](https://perfectbyte.vercel.app)

![Deployment](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![WASM](https://img.shields.io/badge/WebAssembly-jsquash-654FF0?logo=webassembly)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8?logo=pwa)

---

## 🌟 Overview

**PerfectByte** is a local-first, privacy-engineered web suite for precision compression, image conversion, and PDF management. Traditional compression tools upload sensitive documents and photos to external cloud servers, exposing user data to third parties and network latency. PerfectByte executes 100% of image manipulation and document processing locally inside your browser using sandboxed **WebAssembly (WASM)** and **HTML5 Canvas** hardware acceleration.

---

## ✨ Features

- 🏛️ **Target Size Compressor**: Compress images and PDFs to an exact byte threshold (e.g. 50 KB, 100 KB, 200 KB) with precision binary search and safety margins tailored for strict government, university, and employment portals.
- 📦 **Bulk WebP Optimizer**: Compress high-volume directories of images in parallel with instant client-side ZIP packaging via JSZip.
- 🔄 **Format Converter**: Seamlessly convert between WebP, PNG, JPEG, and AVIF in the browser using `@jsquash` WASM encoders.
- 📐 **Pixel-Perfect Resizer**: Scale dimensions with locked aspect ratios and live visual previews.
- 📑 **PDF Studio**: Split, merge, rasterize, compress, and strip blank pages with zero server upload.
- 🤖 **AI Command Center**: Natural language assistant powered by Google Gemini that translates conversational prompts (e.g., *"compress this PDF to 100KB"*) into client-side function executions.
- 📴 **Offline PWA**: Full service-worker caching with pre-cached WASM decoders and fonts for seamless offline operation.

---

## 🔬 How the Precision Algorithm Works

### 1. Decimal Target Standard & Safety Margin
Government portals (e.g., SSC, UPSC, state boards) calculate size limits in decimal (`N × 1,000` bytes) rather than binary (`N × 1,024` bytes). A file of 102,000 bytes submitted to a "100 KB" portal will be rejected. PerfectByte treats every $N\text{ KB}$ input as $N \times 1,000\text{ bytes}$ and targets a $98.8\%$ safety ceiling, guaranteeing acceptance across both decimal and binary validation portals.

### 2. Already-Under-Target Guard
If an uploaded file is already below the user's target threshold, PerfectByte bypasses re-encoding completely, returning the pristine original file untouched to avoid unnecessary generational quality loss.

### 3. Two-Stage Fallback Strategy
- **Stage 1 (Quality Search)**: Performs binary search across encoding quality levels down to a strict $0.15$ quality floor at native image resolution. Tracks the highest quality result that satisfies $\text{size} \le \text{target}$.
- **Stage 2 (Adaptive Resolution Scaling)**: If the quality floor at full resolution cannot reach the target size, the engine dynamically downscales resolution ($0.85 \to 0.70 \to 0.55 \to 0.40 \to 0.25 \to 0.15$) and searches quality again.
- **Ceiling Guarantee**: The algorithm tracks the largest valid output $\le \text{targetBytes}$ and will never return an overshooting iteration.

---

## 🔒 Privacy & Architecture

| Processing Domain | Where It Runs | Data Sent Across Network |
|---|---|---|
| **File Compression & Conversion** | Client Browser (WASM / CPU) | **Zero bytes** (Never leaves your device) |
| **PDF Manipulation & Merging** | Client Browser (pdf-lib / pdfjs) | **Zero bytes** (Never leaves your device) |
| **History & Analytics** | LocalStorage / Vercel Web Analytics | Metadata only (file size & savings count) |
| **AI Command Assistant** | Google Gemini (via Vercel Serverless) | **Prompt text & file metadata only** (file name, type, size) — file contents are never transmitted |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Core Processing**:
  - `@jsquash/webp`, `@jsquash/jpeg`, `@jsquash/png`, `@jsquash/avif` (WebAssembly)
  - `pdf-lib` and `pdfjs-dist` (Local PDF manipulation)
  - `jszip` (Client-side batch archive generation)
- **Offline / PWA**: `vite-plugin-pwa`, `workbox`, `@fontsource/montserrat`
- **Serverless AI**: `@google/generative-ai` (Gemini API via `/api/assistant.ts`), `@upstash/ratelimit`

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/dheerajeshwar32/PerfectByte.git
cd PerfectByte

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for AI mode)
cp .env.example .env
# Add GEMINI_API_KEY if testing AI Assistant locally

# 4. Start local development server
npm run dev
```

### Build & Lint

```bash
# Run ESLint validation
npm run lint

# Production TypeScript compile & Vite bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License
MIT © [Nagula Dheeraj Eshwar Prudhvi](https://github.com/dheerajeshwar32)
