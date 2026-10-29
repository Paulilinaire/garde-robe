import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/garde-robe/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Garde-robe',
        short_name: 'Garde-robe',
        description: 'Ma garde-robe et mes tenues du jour',
        lang: 'fr',
        start_url: '/garde-robe/',
        scope: '/garde-robe/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf8f5',
        theme_color: '#2b2622',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
