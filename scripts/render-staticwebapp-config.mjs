import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("azure/staticwebapp.config.template.json");
const dist = resolve("apps/web/dist");
await mkdir(dist, { recursive: true });
await copyFile(source, resolve(dist, "staticwebapp.config.json"));
console.log("Static Web Apps configuration copied to dist.");
