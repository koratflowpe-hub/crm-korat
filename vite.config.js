import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache para imágenes externas y avatares
            urlPattern: /^https:\/\/.*\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Opcional: Caché de las peticiones a Supabase (dependiendo de tu configuración de React Query,
            // puede que no sea estrictamente necesario si React Query ya guarda en LocalStorage,
            // pero es útil como fallback en NetworkFirst).
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'KoratFlow CRM',
        short_name: 'KoratFlow',
        description: 'Premium CRM Engine for Agencies',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api/n8n': {
        target: 'https://hooks.koratflow.agency',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, '')
      },
      '/api/scraper': {
        target: 'https://hooks.koratflow.agency/webhook/koratflow-lead-ia',
        changeOrigin: true,
        rewrite: () => ''
      }
    }
  }
})
