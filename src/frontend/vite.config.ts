import { powerApps } from "@microsoft/power-apps-vite/plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const adapterByMode: Record<string, string> = {
  powerapps: "./src/platform/adapters/powerapps.ts",
  powerpages: "./src/platform/adapters/powerpages.ts",
  azure: "./src/platform/adapters/azure.ts"
};

export default defineConfig(({ mode }) => {
  const adapter = adapterByMode[mode];
  if (!adapter) {
    throw new Error(`Unsupported Vite mode '${mode}'. Use powerapps, powerpages or azure.`);
  }

  return {
    plugins: [
      react(),
      ...(mode === "powerapps" ? [powerApps()] : [])
    ],
    resolve: {
      alias: {
        "@host-adapter": fileURLToPath(new URL(adapter, import.meta.url))
      }
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      // Public browser artifacts do not contain source maps by default.
      // Derived products can opt into a secure source-map publishing strategy.
      sourcemap: false
    }
  };
});
