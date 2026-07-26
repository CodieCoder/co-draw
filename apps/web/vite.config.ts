import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ENABLED_MODES = ["development", "test"];

export default defineConfig(({ mode }) => {
  const canvasTestApiEnabled = ENABLED_MODES.includes(mode);

  return {
    plugins: [react()],
    define: {
      __VITE_CANVAS_TEST_API_ENABLED__: JSON.stringify(canvasTestApiEnabled),
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    server: {
      host: "localhost",
      port: 5_173,
      strictPort: true,
    },
    preview: {
      host: "localhost",
      port: 5_173,
      strictPort: true,
    },
  };
});
