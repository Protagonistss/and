import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "client",
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "../dist",
    emptyDir: true,
    target: ["es2021", "chrome100"],
    minify: !process.env.TAURI_DEBUG,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("monaco-editor")) return "monaco";
          return undefined;
        },
      },
    },
  },
});
