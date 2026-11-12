import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite's development server only; production builds do not use this proxy.
  server: { proxy: { '/api/leads': 'http://127.0.0.1:47839' } },
});
