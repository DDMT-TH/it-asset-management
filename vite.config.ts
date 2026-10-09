import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleApi } from './server/api.mjs'

// ใช้กับ `npm run dev` และ `npm run preview` (production ใช้ `npm start` -> server.mjs)
function api(): Plugin {
  return {
    name: 'asset-api',
    configureServer: (s) => void s.middlewares.use(handleApi),
    configurePreviewServer: (s) => void s.middlewares.use(handleApi),
  }
}

export default defineConfig({ plugins: [react(), tailwindcss(), api()] })
