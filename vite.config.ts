import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile } from 'fs/promises'

const baseProjectPath = process.env.BASE_PROJECT_PATH || process.cwd()
console.log('Base project path:', baseProjectPath)
const packageJson = JSON.parse(
  await readFile(`${baseProjectPath}/package.json`, { encoding: 'utf-8' })
)
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
    'import.meta.env.THEME_NAME': JSON.stringify(packageJson.name),
    'import.meta.env.THEME_APPEARANCE': JSON.stringify(packageJson.themeAppearance),
    'import.meta.env.BASE_PROJECT_PATH': JSON.stringify(baseProjectPath),
    'import.meta.env.STYLE_SHEETS': JSON.stringify(styleSheets)
  },
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5180,
    strictPort: false,
    fs: {
      strict: false
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-dev-runtime',
      'react/jsx-runtime'
    ]
  }
})
