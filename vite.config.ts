import path from "path"
import react from "@vitejs/plugin-react"
import basicSsl from "@vitejs/plugin-basic-ssl"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

/**
 * Vante - Vite HTTPS Development Server
 * 
 * Vercel'de deploy edilirken bu config Vite build icin kullanilir.
 * Proxy ayarlari Vercel Serverless Functions (/api/*) tarafindan otomatik karsilanir.
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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
