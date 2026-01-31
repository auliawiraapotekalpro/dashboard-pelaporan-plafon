
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Sesuai dengan nama repository Anda di GitHub agar path tidak pecah
  base: '/dashboard-pelaporan-plafon/', 
  build: {
    outDir: 'dist',
  }
});
