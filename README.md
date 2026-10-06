<div align="center">

# 📦 PerfectByte
### Local-First File Compression & AI Assistant

<a href="https://perfectbyte.vercel.app">
  <img src="https://img.shields.io/badge/Live_Demo-3B82F6?style=for-the-badge&logo=vercel" alt="Live Demo" />
</a>
<a href="https://github.com/dheerajeshwar32/PerfectByte">
  <img src="https://img.shields.io/badge/Repository-0F172A?style=for-the-badge&logo=github" alt="Repository" />
</a>

PerfectByte is a privacy-first, client-side web application engineered to perform aggressive file compression and manipulation entirely within the browser. By leveraging **Web Workers** and a **zero-server architecture**, PerfectByte ensures user data never leaves the device.

</div>

---

## ⚡ Live Demo
![PerfectByte Demo](public/demo.gif)
*(Replace `public/demo.gif` with a screen recording of the app in action!)*

## 🧠 System Architecture

PerfectByte avoids traditional backend API bottlenecks. All file I/O, rasterization, and compression algorithms execute locally on the client's CPU.

```mermaid
graph TD
    User[User] -->|Uploads Folder/Files| UI(React UI)
    UI -->|Offloads Task| WorkerPool[Web Worker Pool]
    
    subgraph Client-Side Edge Compute
        WorkerPool -->|Spawns| Worker1[Worker Thread 1]
        WorkerPool -->|Spawns| Worker2[Worker Thread 2]
        Worker1 --> WASM1(WASM Compression Module)
        Worker2 --> WASM2(WASM Compression Module)
    end
    
    WASM1 -->|Yields| File1[Compressed File]
    WASM2 -->|Yields| File2[Compressed File]
    File1 --> UI
    File2 --> UI
    UI -->|Downloads ZIP| User

    UI -.->|Natural Language Prompt| Gemini(Gemini API)
    Gemini -.->|Parsed Commands| UI
```

## ✨ Core Capabilities

*   **Target-Byte Compression Engine:** A precision algorithm allowing users to shrink images or PDFs to an exact maximum byte size via custom UI target sliders, specifically engineered for strict government or academic portal upload limits.
*   **High-Volume Bulk Processing:** Capable of instantly batch-processing entire directories of images without blocking the main UI thread, optimizing storage footprints while maintaining visual fidelity.
*   **Intelligent File Assistant:** An AI-driven command interface powered by Gemini, allowing users to manipulate files, strip blank pages, and compress assets using natural language.
*   **Responsive Glassmorphic UI:** A highly polished, custom-built interface featuring fluid spring animations (Framer Motion).

## 🛠️ Tech Stack

*   **Frontend Core:** React.js, TypeScript, Vite
*   **Styling & UI:** Tailwind CSS, Framer Motion
*   **Processing Engine:** Web Workers, WebAssembly (WASM), Canvas API
*   **Intelligence:** Gemini API
*   **Infrastructure:** Vercel

---

## 🚀 Local Setup Instructions

To run PerfectByte locally and explore the edge-compute architecture:

### Prerequisites
*   Node.js (v18 or higher)
*   Google Gemini API Key (via Google AI Studio)

### 1. Clone the repository
```bash
git clone https://github.com/dheerajeshwar32/PerfectByte.git
cd PerfectByte
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file and add your Gemini API Key:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 4. Start the Development Server
```bash
npm run dev
```
The application will launch and be accessible at `http://localhost:5173`.

---
<div align="center">
<i>Engineered by Nagula Dheeraj Eshwar Prudhvi</i>
</div>
