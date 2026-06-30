import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

/**
 * Vante - Vite Config
 * 
 * HTTPS (dev): Vite 7+ kendi native HTTPS destegi var.
 * BasicSsl plugin'i sadece gelistirme sirasinda otomatik self-signed
 * sertifika uretir. Production'da (Vercel) zaten HTTPS saglanir.
 * 
 * Not: @vitejs/plugin-basic-ssl Vite 7 ile uyumsuz oldugundan
 * kosullu import kullanilir (sadece dev modda yuklenir).
 */
export default defineConfig(async () => {
  const plugins = [inspectAttr(), react()];

  // Sadece dev modda basicSsl yukle (production'da gerekmez)
  if (process.argv.includes('dev') || process.env.NODE_ENV === 'development') {
    try {
      const { default: basicSsl } = await import('@vitejs/plugin-basic-ssl');
      plugins.push(basicSsl({ name: 'vante-local', domains: ['localhost'] }));
    } catch {
      console.warn('[vite] @vitejs/plugin-basic-ssl yuklenemedi');
    }
  }

  return {
    base: './',
    plugins,
    server: {
      port: 3000,
      https: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
