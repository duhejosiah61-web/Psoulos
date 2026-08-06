import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      // Use the full compiler build to support our in-DOM index.html templates during Phase 1
      'vue': 'vue/dist/vue.esm-bundler.js',
    }
  },
  server: {
    port: 8000,
    strictPort: true
  }
});
