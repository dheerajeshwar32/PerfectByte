# PerfectByte ⚡️

PerfectByte is a privacy-first, browser-based file compression and AI utility platform. It was engineered from scratch to solve a critical privacy problem: **preventing users from having to upload sensitive documents to third-party cloud servers.** 

By leveraging WebAssembly and Web Workers, all heavy file processing, compression, and PDF cleaning happens 100% locally on the user's device. 

## 🚀 The Core Engine: Target Size Solver
The flagship feature of PerfectByte is the **Target Size Compressor**. Generic compression tools apply arbitrary quality reductions, forcing users into a cycle of guessing and checking. 

PerfectByte uses a custom binary search algorithm to iterate through compression qualities via `@jsquash/webp` in a background Web Worker, guaranteeing the final image hits the exact maximum byte size required for strict government, university, or corporate portals.

## ✨ Features
* **Privacy-First Architecture:** Files never leave your device for compression.
* **Target Size Compression:** Expand or compress images to an exact KB footprint.
* **Bulk Processing:** Offloaded to dedicated Web Workers to ensure a 60FPS UI during heavy batch jobs.
* **AI File Assistant:** Powered by the Gemini API. Users can upload files and use natural language commands (e.g., *"compress this to 100KB"* or *"remove blank pages"*) to trigger local utility functions.
* **Premium UI:** Built with React, Tailwind CSS, Framer Motion, and Sonner for a flawless, dark-mode-ready aesthetic.

## 🛠 Tech Stack
* **Frontend:** React, TypeScript, Vite
* **Styling & Animation:** Tailwind CSS, Framer Motion
* **Local File Processing:** `@jsquash/webp` (WebAssembly), PDF-lib
* **Multithreading:** Web Workers
* **AI Integration:** Google Gemini Serverless API

## 💻 Local Development
1. Clone the repository: `git clone https://github.com/dheerajeshwar32/perfectbyte.git`
2. Install dependencies: `npm install`
3. Add your Gemini API key to a `.env` file: `GEMINI_API_KEY=your_api_key_here`
4. Start the local server via Vercel CLI: `npx vercel dev`
