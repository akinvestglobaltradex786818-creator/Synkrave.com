import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

const rawPort = process.env.PORT || "5173";
const port = Number(rawPort);

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    process.env.NODE_ENV !== "production" && mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    process.env.NODE_ENV !== "production" && runtimeErrorOverlay(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },

  root: path.resolve(import.meta.dirname),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },

  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
