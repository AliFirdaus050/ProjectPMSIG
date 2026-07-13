import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: {
      key: fs.readFileSync('./10.6.55.200+2-key.pem'),
      cert: fs.readFileSync('./10.6.55.200+2.pem'),
    },
    proxy: {
      '/api': 'http://localhost:4000',
      '/files': 'http://localhost:4000',
    },
  },
});