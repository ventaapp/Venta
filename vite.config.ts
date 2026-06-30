import path from "path"
import react from "@vitejs/plugin-react"
import basicSsl from "@vitejs/plugin-basic-ssl"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

/**
 * Vante - Vite HTTPS Development Server
 * 
 * Local gelistirme icin otomatik self-signed SSL sertifikasi uretir.
 * Capacitor mobil uygulama ile HTTPS baglantisi saglar.
 * 
 * Production'da bu ayarlara gerek yoktur - Firebase/hosting zaten HTTPS saglar.
 */
export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(),
    react(),
    basicSsl({ name: 'vante-local', domains: ['localhost'] })
  ],
  server: {
    port: 3000,
    https: true,
    proxy: {
      '/api/spotify': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
