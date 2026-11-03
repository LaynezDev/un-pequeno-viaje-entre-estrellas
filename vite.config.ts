import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'r3f-ecosystem': ['@react-three/fiber', '@react-three/drei'],
          'firebase-sdk': ['firebase/app', 'firebase/firestore'],
          gsap: ['gsap'],
          'react-vendor': ['react', 'react-dom', 'lucide-react'],
        },
      },
    },
  },
});
