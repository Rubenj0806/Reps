/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Rutas relativas: la app funciona en https://rubenj0806.github.io/Reps/ o en cualquier otra carpeta.
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
  },
});
