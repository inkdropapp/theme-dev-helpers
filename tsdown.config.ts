import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/generate-palette.ts'],
  format: 'esm',
  platform: 'node',
  dts: false
})
