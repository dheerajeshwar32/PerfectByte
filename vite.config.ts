import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'PerfectByte | Zero Compromise Compression',
        short_name: 'PerfectByte',
        description: 'Zero-Server Edge Compute File Compression & AI Assistant',
        theme_color: '#0B0E1B',
        background_color: '#0B0E1B',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/target-size',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/target-size',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'file',
                accept: ['image/*', 'application/pdf']
              }
            ]
          }
        }
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,mjs}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
});
