import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      // V-World API 프록시 설정 (CORS 우회)
      '/api/vworld': {
        target: 'https://api.vworld.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vworld/, ''),
        secure: true,
      },
      // map.vworld.kr도 프록시 설정 추가
      '/api/vworld-map': {
        target: 'http://map.vworld.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vworld-map/, ''),
        secure: false,
      },
    },
  },
});
