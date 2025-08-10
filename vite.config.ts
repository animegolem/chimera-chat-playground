import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // React sidebar application
        sidebar: resolve(__dirname, 'src/sidebar/index.tsx'),
        // Content script
        content: resolve(__dirname, 'src/content/index.ts'),
        // Debug page
        debug: resolve(__dirname, 'src/debug.tsx'),
        // Note: background-simple.js is copied manually, not built by Vite
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    
    // Don't minify for easier debugging during development
    minify: false,
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Ensure we can use browser APIs
    target: 'es2020',
    
    // Copy public assets
    copyPublicDir: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  define: {
    // Ensure we're building for the browser extension environment
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});