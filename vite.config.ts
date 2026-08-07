import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, normalizePath } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const rootDir = normalizePath(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig(() => {
  return {
    root: rootDir,
    base: './',
    plugins: [
      {
        name: 'decode-cyrillic-paths',
        enforce: 'pre',
        resolveId(source) {
          if (source.includes('%D0') || source.includes('%D1')) {
            try {
              return decodeURIComponent(source);
            } catch {
              return null;
            }
          }
          return null;
        }
      },
      react(), 
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      include: ['xlsx', 'lucide-react', 'react', 'react-dom'],
    },
    build: {
      commonjsOptions: {
        include: [/xlsx/, /node_modules/],
        transformMixedEsModules: true,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
