import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: '/meu-saldo/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/meu-saldo/',
        name: 'MeuSaldo',
        short_name: 'MeuSaldo',
        description: 'Gestão financeira pessoal, privada e offline.',
        lang: 'pt-MZ',
        start_url: '/meu-saldo/',
        scope: '/meu-saldo/',
        display: 'standalone',
        background_color: '#0c1512',
        theme_color: '#0c1512',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/meu-saldo/index.html',
      },
    }),
  ],
});
