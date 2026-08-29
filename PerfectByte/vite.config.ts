import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@jsquash/jpeg", "@jsquash/png", "@jsquash/webp", "@jsquash/avif"]
  }
})
