# PerfectByte 

**Zero-Server Edge Compute File Compression & AI Assistant**

[![Deploy Status](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](#) 
[![React](https://img.shields.io/badge/React-18.0-blue?logo=react)](#) 
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Enabled-654FF0?logo=webassembly)](#)
[![Gemini](https://img.shields.io/badge/Gemini_AI-Integrated-8E75B2?logo=google)](#)

PerfectByte is a privacy-first, client-side web application engineered to perform aggressive file compression and manipulation entirely within the browser. By leveraging WebAssembly (WASM) and a zero-server architecture, PerfectByte ensures user data never leaves the device, providing a highly secure, offline-capable alternative to traditional cloud-based utility tools.

## 🏗️ System Architecture & Engineering

This project was built to explore the boundaries of edge computing and client-side processing, specifically avoiding traditional backend API bottlenecks.

*   **Zero-Server Topology:** Eliminates backend storage and processing completely. All file I/O, rasterization, and compression algorithms execute locally on the client's CPU.
*   **WebAssembly (WASM) Integration:** Bypasses JavaScript's single-threaded limitations and performance bottlenecks by utilizing low-level memory management for intensive PDF manipulation and image compression.
*   **Context-Aware AI Routing:** Integrates the Gemini API to parse natural language commands (e.g., "compress this PDF to 100KB") and dynamically translate them into executable, client-side function calls.

## ✨ Core Capabilities

*   **Target-Byte Compression Engine:** A precision algorithm allowing users to shrink images or PDFs to an exact maximum byte size via custom UI target sliders, specifically engineered for strict government or academic portal upload limits.
*   **High-Volume Bulk Processing:** Capable of instantly batch-processing entire directories of images, optimizing storage footprints while utilizing custom algorithms to maintain visual fidelity.
*   **Intelligent File Assistant:** An AI-driven command interface powered by Gemini, allowing users to manipulate files, strip blank pages, and compress assets using natural language.
*   **Responsive Glassmorphic UI:** A highly polished, custom-built interface featuring fluid spring animations (Framer Motion), interactive carousels, and dynamic light/dark mode chromatic aberration branding.

## 🛠️ Technical Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React.js, TypeScript, Vite | Component architecture and blazing-fast local development environment. |
| **Styling & UI** | Tailwind CSS, Framer Motion | Utility-first styling and physics-based spring animations for a native-app feel. |
| **Processing Engine** | WebAssembly (WASM), Canvas API | Client-side execution of heavy file compression and PDF rasterization algorithms. |
| **Intelligence** | Gemini API | Natural language processing for the AI File Assistant. |
| **Infrastructure** | Vercel | Edge-network hosting and continuous deployment pipeline. |

## 🚀 Local Development

To run PerfectByte locally and explore the edge-compute architecture:

```bash
# 1. Clone the repository
git clone [https://github.com/dheerajeshwar32/PerfectByte.git](https://github.com/dheerajeshwar32/PerfectByte.git)

# 2. Navigate to the project directory
cd PerfectByte

# 3. Install dependencies
npm install

# 4. Configure environment variables
# Create a .env file and add your Gemini API Key
VITE_GEMINI_API_KEY=your_api_key_here

# 5. Start the Vite development server
npm run dev
