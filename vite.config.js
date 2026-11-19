import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the same build works on GitHub Pages project paths,
  // on a local file server, and under `vite preview`.
  base: './',
  server: {
    // Deliberately NOT setting Cross-Origin-Opener/Embedder-Policy.
    // GitHub Pages cannot set them, so dev must behave like prod:
    // webR runs on its PostMessage channel in both.
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});
