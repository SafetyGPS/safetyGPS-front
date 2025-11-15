import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL?.replace(/\/$/, '');
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT || 5173);

  return {
    plugins: [react(), vanillaExtractPlugin()],
    resolve: {
      alias: {
        '@': srcPath,
      },
    },
    server: {
      port: devServerPort,
      proxy: {
        // V-World WFS API proxy (avoids CORS)
        '/api/vworld': {
          target: 'https://api.vworld.kr',
          changeOrigin: true,
          rewrite: (urlPath) => urlPath.replace(/^\/api\/vworld/, ''),
          secure: true,
        },
        ...(apiBaseUrl
          ? {
              '/api': {
                target: apiBaseUrl,
                changeOrigin: true,
                secure: false,
              },
            }
          : {}),
      },
    },
  };
});
