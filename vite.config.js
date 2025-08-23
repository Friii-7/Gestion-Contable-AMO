import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['@angular/core', '@angular/common', '@angular/forms'],
          firebase: ['@angular/fire', 'firebase'],
          material: ['@angular/material'],
          utils: ['jspdf', 'jspdf-autotable', 'xlsx', 'file-saver']
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable', 'xlsx', 'file-saver']
  }
});
