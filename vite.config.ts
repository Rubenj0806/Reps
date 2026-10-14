/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` es el nombre del repositorio: la app se publica en https://rubenj0806.github.io/reps/
export default defineConfig({
  plugins: [react()],
  base: '/reps/',
  test: {
    environment: 'node',
  },
});
