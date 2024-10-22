import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const baseProjectPath = process.env.BASE_PROJECT_PATH || process.cwd()
console.log('Base project path:', baseProjectPath)
const packageJson = await import(`${baseProjectPath}/package.json`, {
  with: {
    type: "json",
  }
})
const { styleSheets } = packageJson

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
  define: {
    'import.meta.env.BASE_PROJECT_PATH': JSON.stringify(baseProjectPath),
    'import.meta.env.STYLE_SHEETS': JSON.stringify(styleSheets)
  },
  server: {
    fs: {
      strict: false
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-dev-runtime', 'react/jsx-runtime']
  }
})
