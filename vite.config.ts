import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    base: env.VITE_BASE_PATH || '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    server: {
      fs: {
        // Allow serving files from one level up from the package root
        allow: ['..']
      }
    },
    build: {
      assetsInlineLimit: 0, // Ensure all assets are copied as files
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
            
            const parts = assetInfo.name.split('.');
            const extType = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
            
            if (extType && ['woff2', 'woff', 'ttf'].includes(extType)) {
              return 'assets/fonts/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    },
  }
})
