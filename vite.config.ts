import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "src/renderer"),
      "@shared": resolve(__dirname, "src/shared")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    open: false
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true
  }
});
