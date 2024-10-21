import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const baseProjectPath = process.env.BASE_PROJECT_PATH || fileURLToPath(new URL('../..', import.meta.url))
console.log('Base project path:', baseProjectPath)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: baseProjectPath
      }
    ]
  },
  server: {
    fs: {
      allow: ['src', 'node_modules', baseProjectPath]
    }
  }
})
