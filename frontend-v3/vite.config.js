import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: resolve(__dirname, '../dlx_rest/static/js/v3'),
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/main.js'),
      output: {
        entryFileNames: 'v3-app.js',
        chunkFileNames: 'v3-[name].js',
        assetFileNames: 'v3-[name][extname]'
      }
    }
  },
  test: {
    environment: 'node'
  }
})
