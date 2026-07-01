import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        'tailwind-preset': fileURLToPath(new URL('./src/tailwind-preset.ts', import.meta.url))
      },
      name: 'ZTreeViewVue',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const baseName = entryName === 'index' ? 'ztreeview-vue' : entryName;
        return `${baseName}.${format === 'es' ? 'mjs' : 'cjs'}`;
      }
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        },
        exports: 'named'
      }
    }
  }
});
