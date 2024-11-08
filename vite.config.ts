import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',      // Set source root
  build: {
    outDir: '../',  // Output to 'root'
    target: 'es2016',   // Match your TypeScript target
  },
});