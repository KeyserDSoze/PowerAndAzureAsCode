import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const pkg = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const payload = {
  version: pkg.version,
  commit: process.env.GITHUB_SHA ?? "local",
  builtAtUtc: new Date().toISOString()
};

const outDir = resolve("src/frontend/dist");
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "version.json"), JSON.stringify(payload, null, 2) + "\n");
