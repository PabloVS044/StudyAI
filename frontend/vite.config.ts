import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: localhost:8000. Docker (vite preview): backend:8000 via VITE_PROXY_TARGET.
const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8000";

const proxy = {
  "/api": {
    target: proxyTarget,
    changeOrigin: true,
    timeout: 300000,        // OCR es lento
    proxyTimeout: 300000,
  },
  "/health": {
    target: proxyTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { proxy },
});
