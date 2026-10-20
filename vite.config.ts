import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const appVersion = pkg.version

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Web SPA: absolute base in dev, configurable for sub-path deploys via VITE_ASSET_BASE.
  base: command === 'serve' ? '/' : (process.env.VITE_ASSET_BASE || '/'),
  build: {
    outDir: 'dist/web',
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      '@tanstack/react-query', 'axios', 'lucide-react',
      'date-fns', 'framer-motion', 'recharts', 'clsx',
    ],
  },
}))
