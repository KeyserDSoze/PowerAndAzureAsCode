import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const authMode = (process.env.SWA_AUTH_MODE ?? "preconfigured").toLowerCase();
const dist = resolve("apps/web/dist");

let source;
if (authMode === "singletenant") {
  source = resolve("azure/staticwebapp.singletenant.config.template.json");
} else if (authMode === "preconfigured") {
  source = resolve("azure/staticwebapp.config.template.json");
} else {
  throw new Error("SWA_AUTH_MODE must be 'preconfigured' or 'singletenant'.");
}

let content = await readFile(source, "utf8");

if (authMode === "singletenant") {
  const tenantId = process.env.SWA_ENTRA_TENANT_ID?.trim();
  if (!tenantId || !/^[A-Za-z0-9.-]+$/.test(tenantId)) {
    throw new Error("SWA_ENTRA_TENANT_ID is required for singletenant auth mode.");
  }

  content = content.replaceAll("__ENTRA_TENANT_ID__", tenantId);
}

await mkdir(dist, { recursive: true });
await writeFile(resolve(dist, "staticwebapp.config.json"), content);
console.log(`Rendered Static Web Apps configuration using ${authMode} authentication.`);
