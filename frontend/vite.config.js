import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['../dlx_rest/tests/v3/**/*.test.mjs'],
    passWithNoTests: true
  },
  build: {
    target: 'es2022',
    outDir: '../dlx_rest/static/js/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'e3-editor': fileURLToPath(new URL('./src/main.js', import.meta.url))
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
