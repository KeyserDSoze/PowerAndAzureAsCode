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
  // Power Apps CLI may load Vite config in the default "development" mode
  // before it starts the project's dev command. Treat that config-only load
  // as Power Apps; explicit npm scripts still select their intended host.
  const effectiveMode = mode === "development" ? "powerapps" : mode;
  const adapter = adapterByMode[effectiveMode];
  if (!adapter) {
    throw new Error(`Unsupported Vite mode '${mode}'. Use powerapps, powerpages or azure.`);
  }

  return {
    plugins: [
      react(),
      ...(effectiveMode === "powerapps" ? [powerApps()] : [])
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
