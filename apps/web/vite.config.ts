import { powerApps } from "@microsoft/power-apps-vite/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === "powerapps" ? [powerApps()] : [])
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true
  }
}));
