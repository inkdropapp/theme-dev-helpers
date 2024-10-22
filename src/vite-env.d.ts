/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_PROJECT_PATH: string
  readonly STYLE_SHEETS: string[]
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
