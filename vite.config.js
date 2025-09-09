import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/dot-matrix/',
  server: {
    port: 8080,
    host: true,
  },
});
